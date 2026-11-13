// Policy for lint disable comments.

// A disable comment is allowed only when it says why. The reason follows the
// rule list after " -- ", the ESLint convention oxlint also reads:
//   // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- an SVG <g> cannot be a <button>.
// A bare disable, or one with an empty reason, is reported.
const DISABLE_DIRECTIVE_PATTERN =
  /^\s*(?:oxlint|eslint)-disable(?:-next-line|-line)?(?=\s|$)/u;
const DISABLE_REASON_PATTERN = /\s--\s*\S/u;

export function createRequireDisableReasonRule(context) {
  return {
    Program() {
      for (const comment of context.sourceCode.getAllComments()) {
        if (
          DISABLE_DIRECTIVE_PATTERN.test(comment.value) &&
          !DISABLE_REASON_PATTERN.test(comment.value)
        ) {
          context.report({
            loc: comment.loc,
            message:
              "Say why the rule is disabled: add ` -- <reason>` after the rule names.",
          });
        }
      }
    },
  };
}
