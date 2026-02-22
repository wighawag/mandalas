import {execSync} from 'child_process';
import {resolve} from 'path';
import fs from 'node:fs';
import path from 'node:path';

interface Options {
	buildPath?: string;
	accessToken: string;
	ipnsId?: string;
	useLocalIpfs?: boolean;
}

const FILEBASE_IPFS_RPC = 'https://rpc.filebase.io';
const LOCAL_IPFS_RPC = 'http://localhost:5001';

/**
 * Recursively gets all file paths in a directory
 */
function getFiles(
	dir: string,
	base: string = '',
): {fullPath: string; relPath: string}[] {
	const entries = fs.readdirSync(dir, {withFileTypes: true});
	return entries.flatMap((entry) => {
		const fullPath = path.join(dir, entry.name);
		const relPath = path.join(base, entry.name);
		return entry.isDirectory()
			? getFiles(fullPath, relPath)
			: {fullPath, relPath};
	});
}

async function getCid(buildPath: string, accessToken: string, useLocalIpfs = false): Promise<string> {
	const absoluteBuildPath = resolve(buildPath);
	console.log(`Uploading ${absoluteBuildPath}...`);

	const folderName = path.basename(absoluteBuildPath);
	// Get files with relative paths from the build directory (without the folder name prefix)
	const files = getFiles(absoluteBuildPath, '');

	if (files.length === 0) {
		throw new Error(`No files found in ${absoluteBuildPath}`);
	}

	console.log(`Found ${files.length} files to upload`);

	try {
		// Upload using curl with multipart form data for each file
		// Try using the format that IPFS API expects: file=@path;filename=relPath
		// Use double quotes around the entire form value
		const fileArgs = files.map((f) => `-F "file=@${f.fullPath};filename=${f.relPath}"`).join(' ');
		const rpcUrl = useLocalIpfs ? LOCAL_IPFS_RPC : FILEBASE_IPFS_RPC;
		const authHeader = useLocalIpfs ? '' : `-H "Authorization: Bearer ${accessToken}"`;
		const command = `curl -s -X POST ${authHeader} ${fileArgs} "${rpcUrl}/api/v0/add?wrap-with-directory=true&cid-version=1&pin=true"`;
		console.log(`executing: ${command}`);
		const result = execSync(command, {encoding: 'utf-8'});

		// Check if result is empty
		if (!result || result.trim() === '') {
			throw new Error('Upload failed: Empty response from server');
		}

		// Parse all JSON lines
		const lines = result.trim().split('\n');
		const results = lines.map((line) => JSON.parse(line));

		// Find the root directory entry (the one with empty name)
		const rootDir = results.find((r) => r.Name === '');
		if (!rootDir) {
			throw new Error('Could not find root directory in upload results');
		}

		console.log('Added to IPFS:', rootDir);
		return rootDir.Hash;
	} catch (error) {
		throw error;
	}
}

async function pinCid(cid: string, accessToken: string): Promise<void> {
	const result = execSync(
		`curl -s -X POST -H "Authorization: Bearer ${accessToken}" "${FILEBASE_IPFS_RPC}/api/v0/pin/add?arg=${cid}"`,
		{encoding: 'utf-8'},
	);

	const parsed = JSON.parse(result);
	console.log('Pinned CID:', parsed);
}

async function updateIpns(
	cid: string,
	ipnsKey: string,
	accessToken: string,
): Promise<void> {
	const result = execSync(
		`curl -s -X POST -H "Authorization: Bearer ${accessToken}" "${FILEBASE_IPFS_RPC}/api/v0/name/publish?arg=/ipfs/${cid}&key=${ipnsKey}"`,
		{encoding: 'utf-8'},
	);

	const parsed = JSON.parse(result);
	console.log('Published to IPNS:', parsed);
}

export async function pinToIpfs(options: Options & {useLocalIpfs?: boolean}): Promise<void> {
	const buildPath = resolve(options.buildPath ?? './build');
	const rpcUrl = options.useLocalIpfs ? 'local IPFS' : 'Filebase RPC';
	console.log(`Uploading ${buildPath} to IPFS via ${rpcUrl}...`);

	const cid = await getCid(buildPath, options.accessToken, options.useLocalIpfs);
	console.log(`Directory CID: ${cid}`);

	if (!options.useLocalIpfs) {
		await pinCid(cid, options.accessToken);
	}

	if (options.ipnsId && !options.useLocalIpfs) {
		await updateIpns(cid, options.ipnsId, options.accessToken);
	}

	console.log('Done!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const accessToken = process.env.FILEBASE_ACCESS_TOKEN;
	const ipnsId = process.env.FILEBASE_IPNS_KEY;

	const args = process.argv.slice(2);
	const useLocalIpfs = args.includes('--local');

	if (!useLocalIpfs && !accessToken) {
		console.error(
			'Error: FILEBASE_ACCESS_TOKEN environment variable is required (unless using --local)',
		);
		console.error('Get your API key from: https://console.filebase.com/keys');
		process.exit(1);
	}

	const buildPath = args.find((arg) => !arg.startsWith('--')) ?? './build';

	pinToIpfs({
		buildPath,
		accessToken: accessToken || '',
		ipnsId: ipnsId || undefined,
		useLocalIpfs,
	}).catch((error) => {
		console.error(error);
		process.exit(1);
	});
}
