/**
 * Backwards-compatible entry point for document commands.
 * New code should import from ./document/operations when it needs the
 * semantic document mutation boundary explicitly.
 */
export * from "./document/operations";
