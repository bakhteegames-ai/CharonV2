/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { Engine } from "./game/core/Engine";
import { GameOverlay } from "./ui/GameOverlay";
import { bootstrapPlatform } from "./game/platform/GameProfile";

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<Engine | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Platform bootstrap (content packs / profile → runtime wiring)
    // Must happen before Engine/GameWorld construction.
    bootstrapPlatform();

    // Prevent context menu to avoid long-press selection on mobile
    const handleContextMenu = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);

    const gameEngine = new Engine(containerRef.current);
    setEngine(gameEngine);

    return () => {
      gameEngine.dispose();
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div ref={containerRef} className="absolute inset-0" />
      <GameOverlay engine={engine} />
    </div>
  );
}
