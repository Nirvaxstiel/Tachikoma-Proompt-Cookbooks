{
  description = "Tachikoma Documentation Site - Built with Bun + VitePress";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };
  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = [ pkgs.bun ];
        shellHook = ''
          echo "🕷️ Tachikoma Docs Shell (Bun + VitePress)"
          echo ""
          echo "Quick start:"
          echo "  bun install          # Install dependencies"
          echo "  bun run dev          # Start dev server"
          echo "  bun run build        # Build for production"
          echo "  bun run preview      # Preview production build"
          echo ""
        '';
      };
      packages.${system}.default = pkgs.stdenv.mkDerivation {
        name = "tachikoma-docs";
        src = ./.;
        buildInputs = [ pkgs.bun ];

        buildPhase = ''
          bun install
          bun run build
        '';

        installPhase = ''
          mkdir -p $out
          cp -r .vitepress/dist/* $out/
        '';
      };
      apps.${system}.default = {
        type = "app";
        program = "${pkgs.writeShellScript "tachikoma-dev" ''
          ${pkgs.bun}/bin/bun run dev
        ''}";
      };
      apps.${system}.preview = {
        type = "app";
        program = "${pkgs.writeShellScript "tachikoma-preview" ''
          ${pkgs.bun}/bin/bun run preview
        ''}";
      };
    };
}
