// Path matching shared by the policy rules that exempt files by location.

export function normalizeFilename(filename) {
  return filename.replaceAll("\\", "/");
}

/**
 * Compile one path glob into a matcher over a normalized path. An entry matches
 * a file whose path ends with it, with or without an extension, and a file
 * inside a directory of that name, so a file stem (`motion-config`), a stem
 * prefix (`motion-config*`), a suffix pattern (`*.stories.tsx`) and a rooted
 * pattern (`**\/*.stories.tsx`) all work. `*` stops at a path separator;
 * `**\/` spans any number of directories, including none.
 */
export function pathSuffixPattern(glob) {
  let source = "";
  let index = 0;
  while (index < glob.length) {
    if (glob.startsWith("**/", index)) {
      source += "(?:[^/]*/)*";
      index += 3;
      continue;
    }
    const character = glob[index];
    if (character === "*") {
      source += "[^/]*";
      index += 1;
      continue;
    }
    source += "*+?^${}()|[]\\.".includes(character)
      ? `\\${character}`
      : character;
    index += 1;
  }
  return new RegExp(`(?:^|/)${source}(?:\\.[\\w.]+)?(?:/|$)`, "u");
}

/** True when the file's path matches any of the globs. */
export function matchesAnyPath(filename, globs) {
  return globs.some((glob) => pathSuffixPattern(glob).test(filename));
}
