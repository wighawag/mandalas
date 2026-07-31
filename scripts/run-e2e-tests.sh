#!/usr/bin/env bash
#
# End-to-end tests against a real local chain.
#
#   node -> deploy -> export deployments -> build web (localhost) -> playwright
#
# The wallet is injected by the tests themselves (web/e2e/fixtures/wallet.ts),
# so no browser extension is involved and the app keeps no test-only
# dependency.
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_DIR="$ROOT_DIR/web"

RPC_PORT="${E2E_RPC_PORT:-8545}"
RPC_URL="http://127.0.0.1:${RPC_PORT}"

# The deploy account must be funded on the node. A developer's
# contracts/.env.local may point MNEMONIC_localhost at their own (unfunded)
# mnemonic, so pin it here: exported shell env outranks every .env file in
# ldenv, and this keeps the run identical on every machine.
TEST_MNEMONIC="test test test test test test test test test test test junk"
export MNEMONIC_localhost="$TEST_MNEMONIC"
# The node funds the accounts it derives from MNEMONIC (see the `local` network
# in hardhat.config.ts), while the deploy signs with MNEMONIC_localhost. Pin
# BOTH to the same phrase, otherwise a machine with MNEMONIC set in
# contracts/.env.local funds one set of accounts and deploys from another, and
# the run dies with "Sender doesn't have enough funds".
export MNEMONIC="$TEST_MNEMONIC"
export ETH_NODE_URI_localhost="$RPC_URL"

STARTED_NODE=""

node_is_up() {
	curl -sf -m 2 -X POST "$RPC_URL" \
		-H 'content-type: application/json' \
		-d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null 2>&1
}

cleanup() {
	# Only ever stop what this script started. Port 8545 may belong to a node
	# the developer is using for something else, and killing it would be rude.
	if [ -n "$STARTED_NODE" ]; then
		echo -e "\n${YELLOW}Stopping the hardhat node this run started (pid $STARTED_NODE)${NC}"
		kill "$STARTED_NODE" 2>/dev/null || true
		sleep 1
		kill -9 "$STARTED_NODE" 2>/dev/null || true
	fi
}
trap cleanup EXIT

if node_is_up; then
	echo -e "${YELLOW}A node is already listening on ${RPC_URL}; reusing it.${NC}"
	echo -e "${YELLOW}It must be a dev chain with the standard test accounts funded.${NC}"
else
	echo -e "${GREEN}Starting hardhat node on ${RPC_URL}${NC}"
	# --port must be passed through, otherwise the node always binds 8545 while
	# everything else follows E2E_RPC_PORT, and the run dies on EADDRINUSE when
	# 8545 belongs to something else.
	( cd "$ROOT_DIR" && pnpm contracts:node:local --port "$RPC_PORT" >/tmp/mandalas-e2e-node.log 2>&1 ) &
	STARTED_NODE=$!
	for _ in $(seq 1 40); do
		node_is_up && break
		sleep 1
	done
	if ! node_is_up; then
		echo -e "${RED}Node failed to start. Log:${NC}"
		tail -30 /tmp/mandalas-e2e-node.log || true
		exit 1
	fi
	echo -e "${GREEN}Node is up${NC}"
fi

echo -e "\n${GREEN}Deploying contracts and exporting to the web app${NC}"
# Regenerates web/src/lib/deployments.ts (a generated, gitignored file) so the
# app talks to the freshly deployed contract. `pnpm build <mode>` regenerates
# it for that mode afterwards.
( cd "$ROOT_DIR" && pnpm --filter ./contracts exec ldenv -d localhost pnpm :deploy+export @@ )
( cd "$ROOT_DIR" && pnpm --filter ./contracts exec ldenv -d localhost \
	pnpm rocketh-export -e @@MODE --ts ../web/src/lib/deployments.ts @@ )

echo -e "\n${GREEN}Building the web app for localhost${NC}"
( cd "$ROOT_DIR" && pnpm build localhost )

echo -e "\n${GREEN}Running Playwright${NC}"
cd "$WEB_DIR"
pnpm exec playwright test "$@"
