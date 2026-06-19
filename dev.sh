#!/bin/bash

# Hermdian Development Script
PLUGIN_DIR="$HOME/Documents/Obsidian Vault/.obsidian/plugins/hermdian"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

case "$1" in
  build)
    echo "Building Hermdian..."
    cd "$PROJECT_DIR"
    node esbuild.config.mjs production
    cat src/styles/*.css > styles.css
    echo "Build complete"
    ;;
    
  dev)
    echo "Development mode: build + install"
    cd "$PROJECT_DIR"
    node esbuild.config.mjs production
    cat src/styles/*.css > styles.css
    mkdir -p "$PLUGIN_DIR"
    cp main.js "$PLUGIN_DIR/"
    cp manifest.json "$PLUGIN_DIR/"
    cp styles.css "$PLUGIN_DIR/"
    echo "Done! Reload Obsidian plugin"
    ;;
    
  watch)
    echo "Watching for changes..."
    cd "$PROJECT_DIR"
    node esbuild.config.mjs
    ;;
    
  *)
    echo "Usage: $0 {build|dev|watch}"
    ;;
esac
