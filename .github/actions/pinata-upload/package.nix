{ pkgs }:

pkgs.buildNpmPackage {
  pname = "ipfs-ops";
  version = "1.0.0";

  src = ./.;

  npmDepsHash = "sha256-797fzm/PFd6gLX8VghNEqZfOnJ0j/lJegE1I+Fc1+ac=";

  dontNpmBuild = true;

  installPhase = ''
    mkdir -p $out/bin
    cp -r . $out/lib
    cat > $out/bin/ipfs-ops <<EOF
    #!/usr/bin/env bash
    exec ${pkgs.nodejs}/bin/node $out/lib/cli.js "\$@"
    EOF
    chmod +x $out/bin/ipfs-ops
  '';

  meta = {
    description = "IPFS operations: Upload to Pinata and manage IPNS via Filebase";
    mainProgram = "ipfs-ops";
  };
}
