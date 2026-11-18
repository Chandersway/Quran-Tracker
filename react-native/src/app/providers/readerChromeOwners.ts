/** Retained native reader routes release only their own fullscreen claim. */
export function createReaderChromeOwners() {
  const owners = new Set<symbol>();
  return (owner: symbol, immersive: boolean) => {
    if (immersive) owners.add(owner);
    else owners.delete(owner);
    return owners.size > 0;
  };
}
