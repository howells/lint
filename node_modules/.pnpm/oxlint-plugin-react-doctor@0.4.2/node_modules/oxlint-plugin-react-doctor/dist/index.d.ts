import { TSESTree } from "@typescript-eslint/types";

//#region src/plugin/utils/es-tree-node.d.ts
type WithLooseParent<NodeType> = NodeType extends NodeType ? Omit<NodeType, "parent"> & {
  parent?: EsTreeNode | null;
} : never;
type EsTreeNode = WithLooseParent<TSESTree.Node>;
//#endregion
//#region src/plugin/utils/report-descriptor.d.ts
interface ReportDescriptor {
  node: EsTreeNode;
  message: string;
}
//#endregion
//#region src/plugin/semantic/control-flow-graph.d.ts
type CfgEdgeKind = "uncond" | "cond" | "throw";
interface CfgEdge {
  readonly from: BasicBlock;
  readonly to: BasicBlock;
  readonly kind: CfgEdgeKind;
}
interface BasicBlock {
  readonly id: number;
  readonly nodes: EsTreeNode[];
  readonly successors: CfgEdge[];
  readonly predecessors: CfgEdge[];
}
interface FunctionCfg {
  readonly owner: EsTreeNode;
  readonly entry: BasicBlock;
  readonly exit: BasicBlock;
  readonly blocks: BasicBlock[];
  readonly blockOf: (node: EsTreeNode) => BasicBlock | null;
}
interface ControlFlowAnalysis {
  readonly cfgFor: (functionLike: EsTreeNode) => FunctionCfg | null;
  readonly enclosingFunction: (node: EsTreeNode) => EsTreeNode | null;
  readonly isUnconditionalFromEntry: (node: EsTreeNode) => boolean;
  readonly dominatesExit: (node: EsTreeNode) => boolean;
}
//#endregion
//#region src/plugin/semantic/scope-analysis.d.ts
type SymbolKind = "var" | "let" | "const" | "using" | "function" | "class" | "parameter" | "import" | "ts-import-equals" | "ts-enum" | "ts-type-alias" | "ts-interface" | "ts-module" | "catch-clause-parameter";
type ScopeKind = "module" | "function" | "arrow-function" | "method" | "block" | "class" | "catch" | "for" | "switch" | "with" | "ts-module" | "ts-enum";
interface SymbolDescriptor {
  readonly id: number;
  readonly name: string;
  readonly kind: SymbolKind;
  readonly bindingIdentifier: EsTreeNode;
  readonly declarationNode: EsTreeNode;
  readonly scope: ScopeDescriptor;
  readonly initializer: EsTreeNode | null;
  readonly references: ReferenceDescriptor[];
}
type ReferenceFlag = "read" | "write" | "read-write";
interface ReferenceDescriptor {
  readonly id: number;
  readonly identifier: EsTreeNode;
  resolvedSymbol: SymbolDescriptor | null;
  readonly flag: ReferenceFlag;
  readonly scope: ScopeDescriptor;
}
interface ScopeDescriptor {
  readonly id: number;
  readonly kind: ScopeKind;
  readonly node: EsTreeNode;
  readonly parent: ScopeDescriptor | null;
  readonly children: ScopeDescriptor[];
  readonly symbols: SymbolDescriptor[];
  readonly references: ReferenceDescriptor[];
  readonly symbolsByName: Map<string, SymbolDescriptor>;
}
interface ScopeAnalysis {
  readonly rootScope: ScopeDescriptor;
  readonly scopeFor: (node: EsTreeNode) => ScopeDescriptor;
  readonly ownScopeFor: (node: EsTreeNode) => ScopeDescriptor | null;
  readonly symbolFor: (identifier: EsTreeNode) => SymbolDescriptor | null;
  readonly referenceFor: (identifier: EsTreeNode) => ReferenceDescriptor | null;
  readonly isGlobalReference: (identifier: EsTreeNode) => boolean;
}
//#endregion
//#region src/plugin/utils/rule-context.d.ts
interface BaseRuleContext {
  report: (descriptor: ReportDescriptor) => void;
  readonly filename?: string;
  /**
   * @deprecated Rules use `context.filename`. Read only as a fallback by
   * `wrapWithSemanticContext`; ESLint implements it as a `this`-bound class
   * method, so it must be called on the host context, never a detached
   * reference.
   */
  getFilename?: () => string | undefined;
  readonly settings?: Readonly<Record<string, unknown>>;
}
interface RuleContext extends Omit<BaseRuleContext, "getFilename"> {
  readonly scopes: ScopeAnalysis;
  readonly cfg: ControlFlowAnalysis;
}
//#endregion
//#region src/plugin/utils/rule-visitors.d.ts
interface RuleVisitors {
  [selector: string]: ((node: any) => void) | (() => void);
}
//#endregion
//#region src/plugin/utils/rule.d.ts
type RuleSeverity = "error" | "warn";
type RuleFramework = "global" | "nextjs" | "react-native" | "tanstack-start" | "tanstack-query" | "preact";
interface Rule {
  id: string;
  title?: string;
  severity: RuleSeverity;
  category?: string;
  framework?: RuleFramework;
  requires?: ReadonlyArray<string>;
  disabledBy?: ReadonlyArray<string>;
  tags?: ReadonlyArray<string>;
  defaultEnabled?: boolean;
  lifecycle?: "retired";
  recommendation?: string;
  create: (context: RuleContext) => RuleVisitors;
}
//#endregion
//#region src/plugin/utils/rule-plugin.d.ts
interface HostRule extends Omit<Rule, "create"> {
  create: (context: BaseRuleContext) => RuleVisitors;
}
interface RulePlugin {
  meta: {
    name: string;
  };
  rules: Record<string, HostRule>;
}
//#endregion
//#region src/plugin/react-doctor-plugin.d.ts
declare const plugin: RulePlugin;
//#endregion
//#region src/types.d.ts
type OxlintRuleSeverity = RuleSeverity | "off";
//#endregion
//#region src/rules.d.ts
declare const REACT_DOCTOR_RULES: readonly [{
  readonly key: "react-doctor/activity-wraps-effect-heavy-subtree";
  readonly id: "activity-wraps-effect-heavy-subtree";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/advanced-event-handler-refs";
  readonly id: "advanced-event-handler-refs";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/alt-text";
  readonly id: "alt-text";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/anchor-ambiguous-text";
  readonly id: "anchor-ambiguous-text";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/anchor-has-content";
  readonly id: "anchor-has-content";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/anchor-is-valid";
  readonly id: "anchor-is-valid";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/aria-activedescendant-has-tabindex";
  readonly id: "aria-activedescendant-has-tabindex";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/aria-props";
  readonly id: "aria-props";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/aria-proptypes";
  readonly id: "aria-proptypes";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/aria-role";
  readonly id: "aria-role";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/aria-unsupported-elements";
  readonly id: "aria-unsupported-elements";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/async-await-in-loop";
  readonly id: "async-await-in-loop";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/async-defer-await";
  readonly id: "async-defer-await";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/async-parallel";
  readonly id: "async-parallel";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/autocomplete-valid";
  readonly id: "autocomplete-valid";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/button-has-type";
  readonly id: "button-has-type";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/checked-requires-onchange-or-readonly";
  readonly id: "checked-requires-onchange-or-readonly";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/click-events-have-key-events";
  readonly id: "click-events-have-key-events";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/client-localstorage-no-version";
  readonly id: "client-localstorage-no-version";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/client-passive-event-listeners";
  readonly id: "client-passive-event-listeners";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/control-has-associated-label";
  readonly id: "control-has-associated-label";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/design-no-em-dash-in-jsx-text";
  readonly id: "design-no-em-dash-in-jsx-text";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/design-no-redundant-padding-axes";
  readonly id: "design-no-redundant-padding-axes";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/design-no-redundant-size-axes";
  readonly id: "design-no-redundant-size-axes";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/design-no-space-on-flex-children";
  readonly id: "design-no-space-on-flex-children";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/design-no-three-period-ellipsis";
  readonly id: "design-no-three-period-ellipsis";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/design-no-vague-button-label";
  readonly id: "design-no-vague-button-label";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/display-name";
  readonly id: "display-name";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/effect-needs-cleanup";
  readonly id: "effect-needs-cleanup";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/exhaustive-deps";
  readonly id: "exhaustive-deps";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/expo-no-non-inlined-env";
  readonly id: "expo-no-non-inlined-env";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/forbid-component-props";
  readonly id: "forbid-component-props";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/forbid-dom-props";
  readonly id: "forbid-dom-props";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/forbid-elements";
  readonly id: "forbid-elements";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/forward-ref-uses-ref";
  readonly id: "forward-ref-uses-ref";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/heading-has-content";
  readonly id: "heading-has-content";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/hook-use-state";
  readonly id: "hook-use-state";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/hooks-no-nan-in-deps";
  readonly id: "hooks-no-nan-in-deps";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/html-has-lang";
  readonly id: "html-has-lang";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/html-no-invalid-paragraph-child";
  readonly id: "html-no-invalid-paragraph-child";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/html-no-invalid-table-nesting";
  readonly id: "html-no-invalid-table-nesting";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/html-no-nested-interactive";
  readonly id: "html-no-nested-interactive";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/iframe-has-title";
  readonly id: "iframe-has-title";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/iframe-missing-sandbox";
  readonly id: "iframe-missing-sandbox";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Security";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/img-redundant-alt";
  readonly id: "img-redundant-alt";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/interactive-supports-focus";
  readonly id: "interactive-supports-focus";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jotai-derived-atom-returns-fresh-object";
  readonly id: "jotai-derived-atom-returns-fresh-object";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jotai-select-atom-in-render-body";
  readonly id: "jotai-select-atom-in-render-body";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jotai-tq-use-raw-query-atom";
  readonly id: "jotai-tq-use-raw-query-atom";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-async-reduce-without-awaited-acc";
  readonly id: "js-async-reduce-without-awaited-acc";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-batch-dom-css";
  readonly id: "js-batch-dom-css";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-cache-property-access";
  readonly id: "js-cache-property-access";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-cache-storage";
  readonly id: "js-cache-storage";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-combine-iterations";
  readonly id: "js-combine-iterations";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-early-exit";
  readonly id: "js-early-exit";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-flatmap-filter";
  readonly id: "js-flatmap-filter";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-hoist-intl";
  readonly id: "js-hoist-intl";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-hoist-regexp";
  readonly id: "js-hoist-regexp";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-index-maps";
  readonly id: "js-index-maps";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-length-check-first";
  readonly id: "js-length-check-first";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-min-max-loop";
  readonly id: "js-min-max-loop";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-set-map-lookups";
  readonly id: "js-set-map-lookups";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-tosorted-immutable";
  readonly id: "js-tosorted-immutable";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-boolean-value";
  readonly id: "jsx-boolean-value";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-curly-brace-presence";
  readonly id: "jsx-curly-brace-presence";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-filename-extension";
  readonly id: "jsx-filename-extension";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-fragments";
  readonly id: "jsx-fragments";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-handler-names";
  readonly id: "jsx-handler-names";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-key";
  readonly id: "jsx-key";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-max-depth";
  readonly id: "jsx-max-depth";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-comment-textnodes";
  readonly id: "jsx-no-comment-textnodes";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-constructed-context-values";
  readonly id: "jsx-no-constructed-context-values";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-duplicate-props";
  readonly id: "jsx-no-duplicate-props";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-jsx-as-prop";
  readonly id: "jsx-no-jsx-as-prop";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-new-array-as-prop";
  readonly id: "jsx-no-new-array-as-prop";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-new-function-as-prop";
  readonly id: "jsx-no-new-function-as-prop";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-new-object-as-prop";
  readonly id: "jsx-no-new-object-as-prop";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-script-url";
  readonly id: "jsx-no-script-url";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Security";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-target-blank";
  readonly id: "jsx-no-target-blank";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Security";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-undef";
  readonly id: "jsx-no-undef";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-useless-fragment";
  readonly id: "jsx-no-useless-fragment";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-pascal-case";
  readonly id: "jsx-pascal-case";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-props-no-spread-multi";
  readonly id: "jsx-props-no-spread-multi";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-props-no-spreading";
  readonly id: "jsx-props-no-spreading";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/label-has-associated-control";
  readonly id: "label-has-associated-control";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/lang";
  readonly id: "lang";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/media-has-caption";
  readonly id: "media-has-caption";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/mouse-events-have-key-events";
  readonly id: "mouse-events-have-key-events";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-async-client-component";
  readonly id: "nextjs-async-client-component";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-error-boundary-missing-use-client";
  readonly id: "nextjs-error-boundary-missing-use-client";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-global-error-missing-html-body";
  readonly id: "nextjs-global-error-missing-html-body";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-image-missing-sizes";
  readonly id: "nextjs-image-missing-sizes";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-inline-script-missing-id";
  readonly id: "nextjs-inline-script-missing-id";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-missing-metadata";
  readonly id: "nextjs-missing-metadata";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-a-element";
  readonly id: "nextjs-no-a-element";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-client-fetch-for-server-data";
  readonly id: "nextjs-no-client-fetch-for-server-data";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-client-side-redirect";
  readonly id: "nextjs-no-client-side-redirect";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-css-link";
  readonly id: "nextjs-no-css-link";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-default-export-in-route-handler";
  readonly id: "nextjs-no-default-export-in-route-handler";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-edge-og-runtime";
  readonly id: "nextjs-no-edge-og-runtime";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-font-link";
  readonly id: "nextjs-no-font-link";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-google-analytics-script";
  readonly id: "nextjs-no-google-analytics-script";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-head-import";
  readonly id: "nextjs-no-head-import";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-img-element";
  readonly id: "nextjs-no-img-element";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-native-script";
  readonly id: "nextjs-no-native-script";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-polyfill-script";
  readonly id: "nextjs-no-polyfill-script";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-redirect-in-try-catch";
  readonly id: "nextjs-no-redirect-in-try-catch";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-script-in-head";
  readonly id: "nextjs-no-script-in-head";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-side-effect-in-get-handler";
  readonly id: "nextjs-no-side-effect-in-get-handler";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Security";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-use-search-params-without-suspense";
  readonly id: "nextjs-no-use-search-params-without-suspense";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-vercel-og-import";
  readonly id: "nextjs-no-vercel-og-import";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-access-key";
  readonly id: "no-access-key";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-adjust-state-on-prop-change";
  readonly id: "no-adjust-state-on-prop-change";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-aria-hidden-on-focusable";
  readonly id: "no-aria-hidden-on-focusable";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-array-index-as-key";
  readonly id: "no-array-index-as-key";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-array-index-key";
  readonly id: "no-array-index-key";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-autofocus";
  readonly id: "no-autofocus";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-barrel-import";
  readonly id: "no-barrel-import";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-cascading-set-state";
  readonly id: "no-cascading-set-state";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-chain-state-updates";
  readonly id: "no-chain-state-updates";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-children-prop";
  readonly id: "no-children-prop";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-clone-element";
  readonly id: "no-clone-element";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-create-context-in-render";
  readonly id: "no-create-context-in-render";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-create-store-in-render";
  readonly id: "no-create-store-in-render";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-danger";
  readonly id: "no-danger";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Security";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-danger-with-children";
  readonly id: "no-danger-with-children";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-dark-mode-glow";
  readonly id: "no-dark-mode-glow";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-default-props";
  readonly id: "no-default-props";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-derived-state";
  readonly id: "no-derived-state";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-derived-state-effect";
  readonly id: "no-derived-state-effect";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-derived-useState";
  readonly id: "no-derived-useState";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-did-mount-set-state";
  readonly id: "no-did-mount-set-state";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-did-update-set-state";
  readonly id: "no-did-update-set-state";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-direct-mutation-state";
  readonly id: "no-direct-mutation-state";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-direct-state-mutation";
  readonly id: "no-direct-state-mutation";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-disabled-zoom";
  readonly id: "no-disabled-zoom";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-distracting-elements";
  readonly id: "no-distracting-elements";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-document-start-view-transition";
  readonly id: "no-document-start-view-transition";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-dynamic-import-path";
  readonly id: "no-dynamic-import-path";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-effect-chain";
  readonly id: "no-effect-chain";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-effect-event-handler";
  readonly id: "no-effect-event-handler";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-effect-event-in-deps";
  readonly id: "no-effect-event-in-deps";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-effect-with-fresh-deps";
  readonly id: "no-effect-with-fresh-deps";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-eval";
  readonly id: "no-eval";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Security";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-event-handler";
  readonly id: "no-event-handler";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-event-trigger-state";
  readonly id: "no-event-trigger-state";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-fetch-in-effect";
  readonly id: "no-fetch-in-effect";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-find-dom-node";
  readonly id: "no-find-dom-node";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-flush-sync";
  readonly id: "no-flush-sync";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-full-lodash-import";
  readonly id: "no-full-lodash-import";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-generic-handler-names";
  readonly id: "no-generic-handler-names";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-giant-component";
  readonly id: "no-giant-component";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-global-css-variable-animation";
  readonly id: "no-global-css-variable-animation";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-gradient-text";
  readonly id: "no-gradient-text";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-gray-on-colored-background";
  readonly id: "no-gray-on-colored-background";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-initialize-state";
  readonly id: "no-initialize-state";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-inline-bounce-easing";
  readonly id: "no-inline-bounce-easing";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-inline-exhaustive-style";
  readonly id: "no-inline-exhaustive-style";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-inline-prop-on-memo-component";
  readonly id: "no-inline-prop-on-memo-component";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-interactive-element-to-noninteractive-role";
  readonly id: "no-interactive-element-to-noninteractive-role";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-is-mounted";
  readonly id: "no-is-mounted";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-jsx-element-type";
  readonly id: "no-jsx-element-type";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-justified-text";
  readonly id: "no-justified-text";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-large-animated-blur";
  readonly id: "no-large-animated-blur";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-layout-property-animation";
  readonly id: "no-layout-property-animation";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-layout-transition-inline";
  readonly id: "no-layout-transition-inline";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-legacy-class-lifecycles";
  readonly id: "no-legacy-class-lifecycles";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-legacy-context-api";
  readonly id: "no-legacy-context-api";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-long-transition-duration";
  readonly id: "no-long-transition-duration";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-many-boolean-props";
  readonly id: "no-many-boolean-props";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-mirror-prop-effect";
  readonly id: "no-mirror-prop-effect";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-moment";
  readonly id: "no-moment";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-multi-comp";
  readonly id: "no-multi-comp";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-mutable-in-deps";
  readonly id: "no-mutable-in-deps";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-mutating-reducer-state";
  readonly id: "no-mutating-reducer-state";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-namespace";
  readonly id: "no-namespace";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-nested-component-definition";
  readonly id: "no-nested-component-definition";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-noninteractive-element-interactions";
  readonly id: "no-noninteractive-element-interactions";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-noninteractive-element-to-interactive-role";
  readonly id: "no-noninteractive-element-to-interactive-role";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-noninteractive-tabindex";
  readonly id: "no-noninteractive-tabindex";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-outline-none";
  readonly id: "no-outline-none";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-pass-data-to-parent";
  readonly id: "no-pass-data-to-parent";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-pass-live-state-to-parent";
  readonly id: "no-pass-live-state-to-parent";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-permanent-will-change";
  readonly id: "no-permanent-will-change";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-polymorphic-children";
  readonly id: "no-polymorphic-children";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-prevent-default";
  readonly id: "no-prevent-default";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-prop-callback-in-effect";
  readonly id: "no-prop-callback-in-effect";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-prop-types";
  readonly id: "no-prop-types";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-pure-black-background";
  readonly id: "no-pure-black-background";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-random-key";
  readonly id: "no-random-key";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-react-children";
  readonly id: "no-react-children";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-react-dom-deprecated-apis";
  readonly id: "no-react-dom-deprecated-apis";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-react19-deprecated-apis";
  readonly id: "no-react19-deprecated-apis";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-redundant-roles";
  readonly id: "no-redundant-roles";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-redundant-should-component-update";
  readonly id: "no-redundant-should-component-update";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-render-in-render";
  readonly id: "no-render-in-render";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-render-prop-children";
  readonly id: "no-render-prop-children";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-render-return-value";
  readonly id: "no-render-return-value";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-reset-all-state-on-prop-change";
  readonly id: "no-reset-all-state-on-prop-change";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-scale-from-zero";
  readonly id: "no-scale-from-zero";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-secrets-in-client-code";
  readonly id: "no-secrets-in-client-code";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Security";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-self-updating-effect";
  readonly id: "no-self-updating-effect";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-set-state";
  readonly id: "no-set-state";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-set-state-in-render";
  readonly id: "no-set-state-in-render";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-side-tab-border";
  readonly id: "no-side-tab-border";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-static-element-interactions";
  readonly id: "no-static-element-interactions";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-string-refs";
  readonly id: "no-string-refs";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-this-in-sfc";
  readonly id: "no-this-in-sfc";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-tiny-text";
  readonly id: "no-tiny-text";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-transition-all";
  readonly id: "no-transition-all";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-uncontrolled-input";
  readonly id: "no-uncontrolled-input";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-undeferred-third-party";
  readonly id: "no-undeferred-third-party";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-unescaped-entities";
  readonly id: "no-unescaped-entities";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-unknown-property";
  readonly id: "no-unknown-property";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-unsafe";
  readonly id: "no-unsafe";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-unstable-nested-components";
  readonly id: "no-unstable-nested-components";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-usememo-simple-expression";
  readonly id: "no-usememo-simple-expression";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-wide-letter-spacing";
  readonly id: "no-wide-letter-spacing";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-will-update-set-state";
  readonly id: "no-will-update-set-state";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-z-index-9999";
  readonly id: "no-z-index-9999";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/only-export-components";
  readonly id: "only-export-components";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/preact-no-children-length";
  readonly id: "preact-no-children-length";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "preact";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/preact-no-react-hooks-import";
  readonly id: "preact-no-react-hooks-import";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "preact";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/preact-no-render-arguments";
  readonly id: "preact-no-render-arguments";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "preact";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/preact-prefer-ondblclick";
  readonly id: "preact-prefer-ondblclick";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "preact";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/preact-prefer-oninput";
  readonly id: "preact-prefer-oninput";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "preact";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-dynamic-import";
  readonly id: "prefer-dynamic-import";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-es6-class";
  readonly id: "prefer-es6-class";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-explicit-variants";
  readonly id: "prefer-explicit-variants";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-function-component";
  readonly id: "prefer-function-component";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-html-dialog";
  readonly id: "prefer-html-dialog";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-module-scope-pure-function";
  readonly id: "prefer-module-scope-pure-function";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-module-scope-static-value";
  readonly id: "prefer-module-scope-static-value";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-stable-empty-fallback";
  readonly id: "prefer-stable-empty-fallback";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-tag-over-role";
  readonly id: "prefer-tag-over-role";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-use-effect-event";
  readonly id: "prefer-use-effect-event";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-use-sync-external-store";
  readonly id: "prefer-use-sync-external-store";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-useReducer";
  readonly id: "prefer-useReducer";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/query-destructure-result";
  readonly id: "query-destructure-result";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-query";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/query-mutation-missing-invalidation";
  readonly id: "query-mutation-missing-invalidation";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-query";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/query-no-query-in-effect";
  readonly id: "query-no-query-in-effect";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-query";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/query-no-rest-destructuring";
  readonly id: "query-no-rest-destructuring";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-query";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/query-no-usequery-for-mutation";
  readonly id: "query-no-usequery-for-mutation";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-query";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/query-no-void-query-fn";
  readonly id: "query-no-void-query-fn";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-query";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/query-stable-query-client";
  readonly id: "query-stable-query-client";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-query";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/react-compiler-no-manual-memoization";
  readonly id: "react-compiler-no-manual-memoization";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/react-in-jsx-scope";
  readonly id: "react-in-jsx-scope";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/redux-useselector-inline-derivation";
  readonly id: "redux-useselector-inline-derivation";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/redux-useselector-returns-new-collection";
  readonly id: "redux-useselector-returns-new-collection";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rendering-animate-svg-wrapper";
  readonly id: "rendering-animate-svg-wrapper";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rendering-conditional-render";
  readonly id: "rendering-conditional-render";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rendering-hoist-jsx";
  readonly id: "rendering-hoist-jsx";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rendering-hydration-mismatch-time";
  readonly id: "rendering-hydration-mismatch-time";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rendering-hydration-no-flicker";
  readonly id: "rendering-hydration-no-flicker";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rendering-script-defer-async";
  readonly id: "rendering-script-defer-async";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rendering-svg-precision";
  readonly id: "rendering-svg-precision";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rendering-usetransition-loading";
  readonly id: "rendering-usetransition-loading";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/require-render-return";
  readonly id: "require-render-return";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-defer-reads-hook";
  readonly id: "rerender-defer-reads-hook";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-dependencies";
  readonly id: "rerender-dependencies";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-derived-state-from-hook";
  readonly id: "rerender-derived-state-from-hook";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-functional-setstate";
  readonly id: "rerender-functional-setstate";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-lazy-ref-init";
  readonly id: "rerender-lazy-ref-init";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-lazy-state-init";
  readonly id: "rerender-lazy-state-init";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-memo-before-early-return";
  readonly id: "rerender-memo-before-early-return";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-memo-with-default-value";
  readonly id: "rerender-memo-with-default-value";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-state-only-in-handlers";
  readonly id: "rerender-state-only-in-handlers";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-transitions-scroll";
  readonly id: "rerender-transitions-scroll";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-animate-layout-property";
  readonly id: "rn-animate-layout-property";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-animation-reaction-as-derived";
  readonly id: "rn-animation-reaction-as-derived";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-bottom-sheet-prefer-native";
  readonly id: "rn-bottom-sheet-prefer-native";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-detox-missing-await";
  readonly id: "rn-detox-missing-await";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-list-callback-per-row";
  readonly id: "rn-list-callback-per-row";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-list-data-mapped";
  readonly id: "rn-list-data-mapped";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-list-missing-estimated-item-size";
  readonly id: "rn-list-missing-estimated-item-size";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-list-recyclable-without-types";
  readonly id: "rn-list-recyclable-without-types";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-deep-imports";
  readonly id: "rn-no-deep-imports";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-deprecated-modules";
  readonly id: "rn-no-deprecated-modules";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-dimensions-get";
  readonly id: "rn-no-dimensions-get";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-falsy-and-render";
  readonly id: "rn-no-falsy-and-render";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-image-children";
  readonly id: "rn-no-image-children";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-inline-flatlist-renderitem";
  readonly id: "rn-no-inline-flatlist-renderitem";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-inline-object-in-list-item";
  readonly id: "rn-no-inline-object-in-list-item";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-legacy-expo-packages";
  readonly id: "rn-no-legacy-expo-packages";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-legacy-shadow-styles";
  readonly id: "rn-no-legacy-shadow-styles";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-non-native-navigator";
  readonly id: "rn-no-non-native-navigator";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-panresponder";
  readonly id: "rn-no-panresponder";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-raw-text";
  readonly id: "rn-no-raw-text";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-renderitem-key";
  readonly id: "rn-no-renderitem-key";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-scroll-state";
  readonly id: "rn-no-scroll-state";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-scrollview-mapped-list";
  readonly id: "rn-no-scrollview-mapped-list";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-set-native-props";
  readonly id: "rn-no-set-native-props";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-single-element-style-array";
  readonly id: "rn-no-single-element-style-array";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-prefer-content-inset-adjustment";
  readonly id: "rn-prefer-content-inset-adjustment";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-prefer-expo-image";
  readonly id: "rn-prefer-expo-image";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-prefer-pressable";
  readonly id: "rn-prefer-pressable";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-prefer-pressable-over-gesture-detector";
  readonly id: "rn-prefer-pressable-over-gesture-detector";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-prefer-reanimated";
  readonly id: "rn-prefer-reanimated";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-pressable-shared-value-mutation";
  readonly id: "rn-pressable-shared-value-mutation";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-scrollview-dynamic-padding";
  readonly id: "rn-scrollview-dynamic-padding";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-scrollview-flex-in-content-container";
  readonly id: "rn-scrollview-flex-in-content-container";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-style-prefer-boxshadow";
  readonly id: "rn-style-prefer-boxshadow";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/role-has-required-aria-props";
  readonly id: "role-has-required-aria-props";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/role-supports-aria-props";
  readonly id: "role-supports-aria-props";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rules-of-hooks";
  readonly id: "rules-of-hooks";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/scope";
  readonly id: "scope";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/self-closing-comp";
  readonly id: "self-closing-comp";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/server-after-nonblocking";
  readonly id: "server-after-nonblocking";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/server-auth-actions";
  readonly id: "server-auth-actions";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/server-cache-with-object-literal";
  readonly id: "server-cache-with-object-literal";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/server-dedup-props";
  readonly id: "server-dedup-props";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/server-fetch-without-revalidate";
  readonly id: "server-fetch-without-revalidate";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/server-hoist-static-io";
  readonly id: "server-hoist-static-io";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/server-no-mutable-module-state";
  readonly id: "server-no-mutable-module-state";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/server-sequential-independent-await";
  readonly id: "server-sequential-independent-await";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/state-in-constructor";
  readonly id: "state-in-constructor";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/style-prop-object";
  readonly id: "style-prop-object";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tabindex-no-positive";
  readonly id: "tabindex-no-positive";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-get-mutation";
  readonly id: "tanstack-start-get-mutation";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Security";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-loader-parallel-fetch";
  readonly id: "tanstack-start-loader-parallel-fetch";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-missing-head-content";
  readonly id: "tanstack-start-missing-head-content";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-no-anchor-element";
  readonly id: "tanstack-start-no-anchor-element";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-no-direct-fetch-in-loader";
  readonly id: "tanstack-start-no-direct-fetch-in-loader";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-no-dynamic-server-fn-import";
  readonly id: "tanstack-start-no-dynamic-server-fn-import";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-no-navigate-in-render";
  readonly id: "tanstack-start-no-navigate-in-render";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-no-secrets-in-loader";
  readonly id: "tanstack-start-no-secrets-in-loader";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Security";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-no-use-server-in-handler";
  readonly id: "tanstack-start-no-use-server-in-handler";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-no-useeffect-fetch";
  readonly id: "tanstack-start-no-useeffect-fetch";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-redirect-in-try-catch";
  readonly id: "tanstack-start-redirect-in-try-catch";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-route-property-order";
  readonly id: "tanstack-start-route-property-order";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-server-fn-method-order";
  readonly id: "tanstack-start-server-fn-method-order";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-server-fn-validate-input";
  readonly id: "tanstack-start-server-fn-validate-input";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/use-lazy-motion";
  readonly id: "use-lazy-motion";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/void-dom-elements-no-children";
  readonly id: "void-dom-elements-no-children";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/zod-v4-no-deprecated-error-apis";
  readonly id: "zod-v4-no-deprecated-error-apis";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/zod-v4-no-deprecated-error-customization";
  readonly id: "zod-v4-no-deprecated-error-customization";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/zod-v4-no-deprecated-schema-apis";
  readonly id: "zod-v4-no-deprecated-schema-apis";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/zod-v4-prefer-top-level-string-formats";
  readonly id: "zod-v4-prefer-top-level-string-formats";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}];
declare const EXTERNAL_RULES: readonly [{
  readonly key: "react-hooks-js/set-state-in-render";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/immutability";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/refs";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/purity";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/hooks";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/set-state-in-effect";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/globals";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/error-boundaries";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/preserve-manual-memoization";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/unsupported-syntax";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/component-hook-factories";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/static-components";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/use-memo";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/void-use-memo";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/incompatible-library";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/todo";
  readonly source: "react-compiler";
  readonly severity: "error";
}];
declare const RULES: readonly [{
  readonly key: "react-doctor/activity-wraps-effect-heavy-subtree";
  readonly id: "activity-wraps-effect-heavy-subtree";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/advanced-event-handler-refs";
  readonly id: "advanced-event-handler-refs";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/alt-text";
  readonly id: "alt-text";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/anchor-ambiguous-text";
  readonly id: "anchor-ambiguous-text";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/anchor-has-content";
  readonly id: "anchor-has-content";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/anchor-is-valid";
  readonly id: "anchor-is-valid";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/aria-activedescendant-has-tabindex";
  readonly id: "aria-activedescendant-has-tabindex";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/aria-props";
  readonly id: "aria-props";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/aria-proptypes";
  readonly id: "aria-proptypes";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/aria-role";
  readonly id: "aria-role";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/aria-unsupported-elements";
  readonly id: "aria-unsupported-elements";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/async-await-in-loop";
  readonly id: "async-await-in-loop";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/async-defer-await";
  readonly id: "async-defer-await";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/async-parallel";
  readonly id: "async-parallel";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/autocomplete-valid";
  readonly id: "autocomplete-valid";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/button-has-type";
  readonly id: "button-has-type";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/checked-requires-onchange-or-readonly";
  readonly id: "checked-requires-onchange-or-readonly";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/click-events-have-key-events";
  readonly id: "click-events-have-key-events";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/client-localstorage-no-version";
  readonly id: "client-localstorage-no-version";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/client-passive-event-listeners";
  readonly id: "client-passive-event-listeners";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/control-has-associated-label";
  readonly id: "control-has-associated-label";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/design-no-em-dash-in-jsx-text";
  readonly id: "design-no-em-dash-in-jsx-text";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/design-no-redundant-padding-axes";
  readonly id: "design-no-redundant-padding-axes";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/design-no-redundant-size-axes";
  readonly id: "design-no-redundant-size-axes";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/design-no-space-on-flex-children";
  readonly id: "design-no-space-on-flex-children";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/design-no-three-period-ellipsis";
  readonly id: "design-no-three-period-ellipsis";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/design-no-vague-button-label";
  readonly id: "design-no-vague-button-label";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/display-name";
  readonly id: "display-name";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/effect-needs-cleanup";
  readonly id: "effect-needs-cleanup";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/exhaustive-deps";
  readonly id: "exhaustive-deps";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/expo-no-non-inlined-env";
  readonly id: "expo-no-non-inlined-env";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/forbid-component-props";
  readonly id: "forbid-component-props";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/forbid-dom-props";
  readonly id: "forbid-dom-props";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/forbid-elements";
  readonly id: "forbid-elements";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/forward-ref-uses-ref";
  readonly id: "forward-ref-uses-ref";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/heading-has-content";
  readonly id: "heading-has-content";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/hook-use-state";
  readonly id: "hook-use-state";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/hooks-no-nan-in-deps";
  readonly id: "hooks-no-nan-in-deps";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/html-has-lang";
  readonly id: "html-has-lang";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/html-no-invalid-paragraph-child";
  readonly id: "html-no-invalid-paragraph-child";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/html-no-invalid-table-nesting";
  readonly id: "html-no-invalid-table-nesting";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/html-no-nested-interactive";
  readonly id: "html-no-nested-interactive";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/iframe-has-title";
  readonly id: "iframe-has-title";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/iframe-missing-sandbox";
  readonly id: "iframe-missing-sandbox";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Security";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/img-redundant-alt";
  readonly id: "img-redundant-alt";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/interactive-supports-focus";
  readonly id: "interactive-supports-focus";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jotai-derived-atom-returns-fresh-object";
  readonly id: "jotai-derived-atom-returns-fresh-object";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jotai-select-atom-in-render-body";
  readonly id: "jotai-select-atom-in-render-body";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jotai-tq-use-raw-query-atom";
  readonly id: "jotai-tq-use-raw-query-atom";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-async-reduce-without-awaited-acc";
  readonly id: "js-async-reduce-without-awaited-acc";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-batch-dom-css";
  readonly id: "js-batch-dom-css";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-cache-property-access";
  readonly id: "js-cache-property-access";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-cache-storage";
  readonly id: "js-cache-storage";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-combine-iterations";
  readonly id: "js-combine-iterations";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-early-exit";
  readonly id: "js-early-exit";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-flatmap-filter";
  readonly id: "js-flatmap-filter";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-hoist-intl";
  readonly id: "js-hoist-intl";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-hoist-regexp";
  readonly id: "js-hoist-regexp";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-index-maps";
  readonly id: "js-index-maps";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-length-check-first";
  readonly id: "js-length-check-first";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-min-max-loop";
  readonly id: "js-min-max-loop";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-set-map-lookups";
  readonly id: "js-set-map-lookups";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/js-tosorted-immutable";
  readonly id: "js-tosorted-immutable";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-boolean-value";
  readonly id: "jsx-boolean-value";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-curly-brace-presence";
  readonly id: "jsx-curly-brace-presence";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-filename-extension";
  readonly id: "jsx-filename-extension";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-fragments";
  readonly id: "jsx-fragments";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-handler-names";
  readonly id: "jsx-handler-names";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-key";
  readonly id: "jsx-key";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-max-depth";
  readonly id: "jsx-max-depth";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-comment-textnodes";
  readonly id: "jsx-no-comment-textnodes";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-constructed-context-values";
  readonly id: "jsx-no-constructed-context-values";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-duplicate-props";
  readonly id: "jsx-no-duplicate-props";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-jsx-as-prop";
  readonly id: "jsx-no-jsx-as-prop";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-new-array-as-prop";
  readonly id: "jsx-no-new-array-as-prop";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-new-function-as-prop";
  readonly id: "jsx-no-new-function-as-prop";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-new-object-as-prop";
  readonly id: "jsx-no-new-object-as-prop";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-script-url";
  readonly id: "jsx-no-script-url";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Security";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-target-blank";
  readonly id: "jsx-no-target-blank";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Security";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-undef";
  readonly id: "jsx-no-undef";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-no-useless-fragment";
  readonly id: "jsx-no-useless-fragment";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-pascal-case";
  readonly id: "jsx-pascal-case";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-props-no-spread-multi";
  readonly id: "jsx-props-no-spread-multi";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/jsx-props-no-spreading";
  readonly id: "jsx-props-no-spreading";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/label-has-associated-control";
  readonly id: "label-has-associated-control";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/lang";
  readonly id: "lang";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/media-has-caption";
  readonly id: "media-has-caption";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/mouse-events-have-key-events";
  readonly id: "mouse-events-have-key-events";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-async-client-component";
  readonly id: "nextjs-async-client-component";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-error-boundary-missing-use-client";
  readonly id: "nextjs-error-boundary-missing-use-client";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-global-error-missing-html-body";
  readonly id: "nextjs-global-error-missing-html-body";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-image-missing-sizes";
  readonly id: "nextjs-image-missing-sizes";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-inline-script-missing-id";
  readonly id: "nextjs-inline-script-missing-id";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-missing-metadata";
  readonly id: "nextjs-missing-metadata";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-a-element";
  readonly id: "nextjs-no-a-element";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-client-fetch-for-server-data";
  readonly id: "nextjs-no-client-fetch-for-server-data";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-client-side-redirect";
  readonly id: "nextjs-no-client-side-redirect";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-css-link";
  readonly id: "nextjs-no-css-link";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-default-export-in-route-handler";
  readonly id: "nextjs-no-default-export-in-route-handler";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-edge-og-runtime";
  readonly id: "nextjs-no-edge-og-runtime";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-font-link";
  readonly id: "nextjs-no-font-link";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-google-analytics-script";
  readonly id: "nextjs-no-google-analytics-script";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-head-import";
  readonly id: "nextjs-no-head-import";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-img-element";
  readonly id: "nextjs-no-img-element";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-native-script";
  readonly id: "nextjs-no-native-script";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-polyfill-script";
  readonly id: "nextjs-no-polyfill-script";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-redirect-in-try-catch";
  readonly id: "nextjs-no-redirect-in-try-catch";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-script-in-head";
  readonly id: "nextjs-no-script-in-head";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-side-effect-in-get-handler";
  readonly id: "nextjs-no-side-effect-in-get-handler";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Security";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-use-search-params-without-suspense";
  readonly id: "nextjs-no-use-search-params-without-suspense";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/nextjs-no-vercel-og-import";
  readonly id: "nextjs-no-vercel-og-import";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "nextjs";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-access-key";
  readonly id: "no-access-key";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-adjust-state-on-prop-change";
  readonly id: "no-adjust-state-on-prop-change";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-aria-hidden-on-focusable";
  readonly id: "no-aria-hidden-on-focusable";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-array-index-as-key";
  readonly id: "no-array-index-as-key";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-array-index-key";
  readonly id: "no-array-index-key";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-autofocus";
  readonly id: "no-autofocus";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-barrel-import";
  readonly id: "no-barrel-import";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-cascading-set-state";
  readonly id: "no-cascading-set-state";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-chain-state-updates";
  readonly id: "no-chain-state-updates";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-children-prop";
  readonly id: "no-children-prop";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-clone-element";
  readonly id: "no-clone-element";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-create-context-in-render";
  readonly id: "no-create-context-in-render";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-create-store-in-render";
  readonly id: "no-create-store-in-render";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-danger";
  readonly id: "no-danger";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Security";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-danger-with-children";
  readonly id: "no-danger-with-children";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-dark-mode-glow";
  readonly id: "no-dark-mode-glow";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-default-props";
  readonly id: "no-default-props";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-derived-state";
  readonly id: "no-derived-state";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-derived-state-effect";
  readonly id: "no-derived-state-effect";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-derived-useState";
  readonly id: "no-derived-useState";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-did-mount-set-state";
  readonly id: "no-did-mount-set-state";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-did-update-set-state";
  readonly id: "no-did-update-set-state";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-direct-mutation-state";
  readonly id: "no-direct-mutation-state";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-direct-state-mutation";
  readonly id: "no-direct-state-mutation";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-disabled-zoom";
  readonly id: "no-disabled-zoom";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-distracting-elements";
  readonly id: "no-distracting-elements";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-document-start-view-transition";
  readonly id: "no-document-start-view-transition";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-dynamic-import-path";
  readonly id: "no-dynamic-import-path";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-effect-chain";
  readonly id: "no-effect-chain";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-effect-event-handler";
  readonly id: "no-effect-event-handler";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-effect-event-in-deps";
  readonly id: "no-effect-event-in-deps";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-effect-with-fresh-deps";
  readonly id: "no-effect-with-fresh-deps";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-eval";
  readonly id: "no-eval";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Security";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-event-handler";
  readonly id: "no-event-handler";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-event-trigger-state";
  readonly id: "no-event-trigger-state";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-fetch-in-effect";
  readonly id: "no-fetch-in-effect";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-find-dom-node";
  readonly id: "no-find-dom-node";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-flush-sync";
  readonly id: "no-flush-sync";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-full-lodash-import";
  readonly id: "no-full-lodash-import";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-generic-handler-names";
  readonly id: "no-generic-handler-names";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-giant-component";
  readonly id: "no-giant-component";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-global-css-variable-animation";
  readonly id: "no-global-css-variable-animation";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-gradient-text";
  readonly id: "no-gradient-text";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-gray-on-colored-background";
  readonly id: "no-gray-on-colored-background";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-initialize-state";
  readonly id: "no-initialize-state";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-inline-bounce-easing";
  readonly id: "no-inline-bounce-easing";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-inline-exhaustive-style";
  readonly id: "no-inline-exhaustive-style";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-inline-prop-on-memo-component";
  readonly id: "no-inline-prop-on-memo-component";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-interactive-element-to-noninteractive-role";
  readonly id: "no-interactive-element-to-noninteractive-role";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-is-mounted";
  readonly id: "no-is-mounted";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-jsx-element-type";
  readonly id: "no-jsx-element-type";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-justified-text";
  readonly id: "no-justified-text";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-large-animated-blur";
  readonly id: "no-large-animated-blur";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-layout-property-animation";
  readonly id: "no-layout-property-animation";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-layout-transition-inline";
  readonly id: "no-layout-transition-inline";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-legacy-class-lifecycles";
  readonly id: "no-legacy-class-lifecycles";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-legacy-context-api";
  readonly id: "no-legacy-context-api";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-long-transition-duration";
  readonly id: "no-long-transition-duration";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-many-boolean-props";
  readonly id: "no-many-boolean-props";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-mirror-prop-effect";
  readonly id: "no-mirror-prop-effect";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-moment";
  readonly id: "no-moment";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-multi-comp";
  readonly id: "no-multi-comp";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-mutable-in-deps";
  readonly id: "no-mutable-in-deps";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-mutating-reducer-state";
  readonly id: "no-mutating-reducer-state";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-namespace";
  readonly id: "no-namespace";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-nested-component-definition";
  readonly id: "no-nested-component-definition";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-noninteractive-element-interactions";
  readonly id: "no-noninteractive-element-interactions";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-noninteractive-element-to-interactive-role";
  readonly id: "no-noninteractive-element-to-interactive-role";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-noninteractive-tabindex";
  readonly id: "no-noninteractive-tabindex";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-outline-none";
  readonly id: "no-outline-none";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-pass-data-to-parent";
  readonly id: "no-pass-data-to-parent";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-pass-live-state-to-parent";
  readonly id: "no-pass-live-state-to-parent";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-permanent-will-change";
  readonly id: "no-permanent-will-change";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-polymorphic-children";
  readonly id: "no-polymorphic-children";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-prevent-default";
  readonly id: "no-prevent-default";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-prop-callback-in-effect";
  readonly id: "no-prop-callback-in-effect";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-prop-types";
  readonly id: "no-prop-types";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-pure-black-background";
  readonly id: "no-pure-black-background";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-random-key";
  readonly id: "no-random-key";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-react-children";
  readonly id: "no-react-children";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-react-dom-deprecated-apis";
  readonly id: "no-react-dom-deprecated-apis";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-react19-deprecated-apis";
  readonly id: "no-react19-deprecated-apis";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-redundant-roles";
  readonly id: "no-redundant-roles";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-redundant-should-component-update";
  readonly id: "no-redundant-should-component-update";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-render-in-render";
  readonly id: "no-render-in-render";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-render-prop-children";
  readonly id: "no-render-prop-children";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-render-return-value";
  readonly id: "no-render-return-value";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-reset-all-state-on-prop-change";
  readonly id: "no-reset-all-state-on-prop-change";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-scale-from-zero";
  readonly id: "no-scale-from-zero";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-secrets-in-client-code";
  readonly id: "no-secrets-in-client-code";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Security";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-self-updating-effect";
  readonly id: "no-self-updating-effect";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-set-state";
  readonly id: "no-set-state";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-set-state-in-render";
  readonly id: "no-set-state-in-render";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-side-tab-border";
  readonly id: "no-side-tab-border";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-static-element-interactions";
  readonly id: "no-static-element-interactions";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-string-refs";
  readonly id: "no-string-refs";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-this-in-sfc";
  readonly id: "no-this-in-sfc";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-tiny-text";
  readonly id: "no-tiny-text";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-transition-all";
  readonly id: "no-transition-all";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-uncontrolled-input";
  readonly id: "no-uncontrolled-input";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-undeferred-third-party";
  readonly id: "no-undeferred-third-party";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-unescaped-entities";
  readonly id: "no-unescaped-entities";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-unknown-property";
  readonly id: "no-unknown-property";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-unsafe";
  readonly id: "no-unsafe";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-unstable-nested-components";
  readonly id: "no-unstable-nested-components";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-usememo-simple-expression";
  readonly id: "no-usememo-simple-expression";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-wide-letter-spacing";
  readonly id: "no-wide-letter-spacing";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-will-update-set-state";
  readonly id: "no-will-update-set-state";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/no-z-index-9999";
  readonly id: "no-z-index-9999";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/only-export-components";
  readonly id: "only-export-components";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/preact-no-children-length";
  readonly id: "preact-no-children-length";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "preact";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/preact-no-react-hooks-import";
  readonly id: "preact-no-react-hooks-import";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "preact";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/preact-no-render-arguments";
  readonly id: "preact-no-render-arguments";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "preact";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/preact-prefer-ondblclick";
  readonly id: "preact-prefer-ondblclick";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "preact";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/preact-prefer-oninput";
  readonly id: "preact-prefer-oninput";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "preact";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-dynamic-import";
  readonly id: "prefer-dynamic-import";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-es6-class";
  readonly id: "prefer-es6-class";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-explicit-variants";
  readonly id: "prefer-explicit-variants";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-function-component";
  readonly id: "prefer-function-component";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-html-dialog";
  readonly id: "prefer-html-dialog";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-module-scope-pure-function";
  readonly id: "prefer-module-scope-pure-function";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-module-scope-static-value";
  readonly id: "prefer-module-scope-static-value";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-stable-empty-fallback";
  readonly id: "prefer-stable-empty-fallback";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-tag-over-role";
  readonly id: "prefer-tag-over-role";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-use-effect-event";
  readonly id: "prefer-use-effect-event";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-use-sync-external-store";
  readonly id: "prefer-use-sync-external-store";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/prefer-useReducer";
  readonly id: "prefer-useReducer";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/query-destructure-result";
  readonly id: "query-destructure-result";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-query";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/query-mutation-missing-invalidation";
  readonly id: "query-mutation-missing-invalidation";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-query";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/query-no-query-in-effect";
  readonly id: "query-no-query-in-effect";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-query";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/query-no-rest-destructuring";
  readonly id: "query-no-rest-destructuring";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-query";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/query-no-usequery-for-mutation";
  readonly id: "query-no-usequery-for-mutation";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-query";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/query-no-void-query-fn";
  readonly id: "query-no-void-query-fn";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-query";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/query-stable-query-client";
  readonly id: "query-stable-query-client";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-query";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/react-compiler-no-manual-memoization";
  readonly id: "react-compiler-no-manual-memoization";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/react-in-jsx-scope";
  readonly id: "react-in-jsx-scope";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/redux-useselector-inline-derivation";
  readonly id: "redux-useselector-inline-derivation";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/redux-useselector-returns-new-collection";
  readonly id: "redux-useselector-returns-new-collection";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rendering-animate-svg-wrapper";
  readonly id: "rendering-animate-svg-wrapper";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rendering-conditional-render";
  readonly id: "rendering-conditional-render";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rendering-hoist-jsx";
  readonly id: "rendering-hoist-jsx";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rendering-hydration-mismatch-time";
  readonly id: "rendering-hydration-mismatch-time";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rendering-hydration-no-flicker";
  readonly id: "rendering-hydration-no-flicker";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rendering-script-defer-async";
  readonly id: "rendering-script-defer-async";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rendering-svg-precision";
  readonly id: "rendering-svg-precision";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rendering-usetransition-loading";
  readonly id: "rendering-usetransition-loading";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/require-render-return";
  readonly id: "require-render-return";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-defer-reads-hook";
  readonly id: "rerender-defer-reads-hook";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-dependencies";
  readonly id: "rerender-dependencies";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-derived-state-from-hook";
  readonly id: "rerender-derived-state-from-hook";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-functional-setstate";
  readonly id: "rerender-functional-setstate";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-lazy-ref-init";
  readonly id: "rerender-lazy-ref-init";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-lazy-state-init";
  readonly id: "rerender-lazy-state-init";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-memo-before-early-return";
  readonly id: "rerender-memo-before-early-return";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-memo-with-default-value";
  readonly id: "rerender-memo-with-default-value";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-state-only-in-handlers";
  readonly id: "rerender-state-only-in-handlers";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rerender-transitions-scroll";
  readonly id: "rerender-transitions-scroll";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-animate-layout-property";
  readonly id: "rn-animate-layout-property";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-animation-reaction-as-derived";
  readonly id: "rn-animation-reaction-as-derived";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-bottom-sheet-prefer-native";
  readonly id: "rn-bottom-sheet-prefer-native";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-detox-missing-await";
  readonly id: "rn-detox-missing-await";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-list-callback-per-row";
  readonly id: "rn-list-callback-per-row";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-list-data-mapped";
  readonly id: "rn-list-data-mapped";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-list-missing-estimated-item-size";
  readonly id: "rn-list-missing-estimated-item-size";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-list-recyclable-without-types";
  readonly id: "rn-list-recyclable-without-types";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-deep-imports";
  readonly id: "rn-no-deep-imports";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-deprecated-modules";
  readonly id: "rn-no-deprecated-modules";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-dimensions-get";
  readonly id: "rn-no-dimensions-get";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-falsy-and-render";
  readonly id: "rn-no-falsy-and-render";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-image-children";
  readonly id: "rn-no-image-children";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-inline-flatlist-renderitem";
  readonly id: "rn-no-inline-flatlist-renderitem";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-inline-object-in-list-item";
  readonly id: "rn-no-inline-object-in-list-item";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-legacy-expo-packages";
  readonly id: "rn-no-legacy-expo-packages";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-legacy-shadow-styles";
  readonly id: "rn-no-legacy-shadow-styles";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-non-native-navigator";
  readonly id: "rn-no-non-native-navigator";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-panresponder";
  readonly id: "rn-no-panresponder";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-raw-text";
  readonly id: "rn-no-raw-text";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-renderitem-key";
  readonly id: "rn-no-renderitem-key";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-scroll-state";
  readonly id: "rn-no-scroll-state";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-scrollview-mapped-list";
  readonly id: "rn-no-scrollview-mapped-list";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-set-native-props";
  readonly id: "rn-no-set-native-props";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-no-single-element-style-array";
  readonly id: "rn-no-single-element-style-array";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-prefer-content-inset-adjustment";
  readonly id: "rn-prefer-content-inset-adjustment";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-prefer-expo-image";
  readonly id: "rn-prefer-expo-image";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-prefer-pressable";
  readonly id: "rn-prefer-pressable";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-prefer-pressable-over-gesture-detector";
  readonly id: "rn-prefer-pressable-over-gesture-detector";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-prefer-reanimated";
  readonly id: "rn-prefer-reanimated";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-pressable-shared-value-mutation";
  readonly id: "rn-pressable-shared-value-mutation";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-scrollview-dynamic-padding";
  readonly id: "rn-scrollview-dynamic-padding";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-scrollview-flex-in-content-container";
  readonly id: "rn-scrollview-flex-in-content-container";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rn-style-prefer-boxshadow";
  readonly id: "rn-style-prefer-boxshadow";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "react-native";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/role-has-required-aria-props";
  readonly id: "role-has-required-aria-props";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/role-supports-aria-props";
  readonly id: "role-supports-aria-props";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/rules-of-hooks";
  readonly id: "rules-of-hooks";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/scope";
  readonly id: "scope";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/self-closing-comp";
  readonly id: "self-closing-comp";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/server-after-nonblocking";
  readonly id: "server-after-nonblocking";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/server-auth-actions";
  readonly id: "server-auth-actions";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/server-cache-with-object-literal";
  readonly id: "server-cache-with-object-literal";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/server-dedup-props";
  readonly id: "server-dedup-props";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/server-fetch-without-revalidate";
  readonly id: "server-fetch-without-revalidate";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/server-hoist-static-io";
  readonly id: "server-hoist-static-io";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/server-no-mutable-module-state";
  readonly id: "server-no-mutable-module-state";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/server-sequential-independent-await";
  readonly id: "server-sequential-independent-await";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly tags: readonly string[];
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/state-in-constructor";
  readonly id: "state-in-constructor";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/style-prop-object";
  readonly id: "style-prop-object";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tabindex-no-positive";
  readonly id: "tabindex-no-positive";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Accessibility";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-get-mutation";
  readonly id: "tanstack-start-get-mutation";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Security";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-loader-parallel-fetch";
  readonly id: "tanstack-start-loader-parallel-fetch";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-missing-head-content";
  readonly id: "tanstack-start-missing-head-content";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-no-anchor-element";
  readonly id: "tanstack-start-no-anchor-element";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-no-direct-fetch-in-loader";
  readonly id: "tanstack-start-no-direct-fetch-in-loader";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-no-dynamic-server-fn-import";
  readonly id: "tanstack-start-no-dynamic-server-fn-import";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-no-navigate-in-render";
  readonly id: "tanstack-start-no-navigate-in-render";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-no-secrets-in-loader";
  readonly id: "tanstack-start-no-secrets-in-loader";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Security";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-no-use-server-in-handler";
  readonly id: "tanstack-start-no-use-server-in-handler";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-no-useeffect-fetch";
  readonly id: "tanstack-start-no-useeffect-fetch";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-redirect-in-try-catch";
  readonly id: "tanstack-start-redirect-in-try-catch";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-route-property-order";
  readonly id: "tanstack-start-route-property-order";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-server-fn-method-order";
  readonly id: "tanstack-start-server-fn-method-order";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/tanstack-start-server-fn-validate-input";
  readonly id: "tanstack-start-server-fn-validate-input";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "tanstack-start";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/use-lazy-motion";
  readonly id: "use-lazy-motion";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Performance";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/void-dom-elements-no-children";
  readonly id: "void-dom-elements-no-children";
  readonly source: "react-doctor";
  readonly originallyExternal: true;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Bugs";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/zod-v4-no-deprecated-error-apis";
  readonly id: "zod-v4-no-deprecated-error-apis";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/zod-v4-no-deprecated-error-customization";
  readonly id: "zod-v4-no-deprecated-error-customization";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/zod-v4-no-deprecated-schema-apis";
  readonly id: "zod-v4-no-deprecated-schema-apis";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-doctor/zod-v4-prefer-top-level-string-formats";
  readonly id: "zod-v4-prefer-top-level-string-formats";
  readonly source: "react-doctor";
  readonly originallyExternal: false;
  readonly rule: {
    readonly framework: "global";
    readonly category: "Maintainability";
    readonly id: string;
    readonly title?: string;
    readonly severity: RuleSeverity;
    readonly requires?: ReadonlyArray<string>;
    readonly disabledBy?: ReadonlyArray<string>;
    readonly tags?: ReadonlyArray<string>;
    readonly defaultEnabled?: boolean;
    readonly lifecycle?: "retired";
    readonly recommendation?: string;
    readonly create: (context: RuleContext) => RuleVisitors;
  };
}, {
  readonly key: "react-hooks-js/set-state-in-render";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/immutability";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/refs";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/purity";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/hooks";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/set-state-in-effect";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/globals";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/error-boundaries";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/preserve-manual-memoization";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/unsupported-syntax";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/component-hook-factories";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/static-components";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/use-memo";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/void-use-memo";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/incompatible-library";
  readonly source: "react-compiler";
  readonly severity: "error";
}, {
  readonly key: "react-hooks-js/todo";
  readonly source: "react-compiler";
  readonly severity: "error";
}];
declare const RECOMMENDED_RULES: Record<string, OxlintRuleSeverity>;
declare const NEXTJS_RULES: Record<string, OxlintRuleSeverity>;
declare const REACT_NATIVE_RULES: Record<string, OxlintRuleSeverity>;
declare const TANSTACK_START_RULES: Record<string, OxlintRuleSeverity>;
declare const TANSTACK_QUERY_RULES: Record<string, OxlintRuleSeverity>;
declare const PREACT_RULES: Record<string, OxlintRuleSeverity>;
declare const ALL_REACT_DOCTOR_RULES: Record<string, OxlintRuleSeverity>;
declare const ALL_REACT_DOCTOR_RULE_KEYS: ReadonlySet<string>;
declare const FRAMEWORK_SPECIFIC_RULE_KEYS: ReadonlySet<string>;
declare const REACT_COMPILER_RULES: Record<string, OxlintRuleSeverity>;
//#endregion
//#region src/plugin/constants/style.d.ts
declare const MOTION_LIBRARY_PACKAGES: Set<string>;
//#endregion
//#region src/react-native-dependency-names.d.ts
declare const REACT_NATIVE_DEPENDENCY_NAMES: ReadonlySet<string>;
declare const REACT_NATIVE_DEPENDENCY_PREFIXES: ReadonlyArray<string>;
declare const isReactNativeDependencyName: (dependencyName: string) => boolean;
//#endregion
export { ALL_REACT_DOCTOR_RULES, ALL_REACT_DOCTOR_RULE_KEYS, EXTERNAL_RULES, type EsTreeNode, FRAMEWORK_SPECIFIC_RULE_KEYS, MOTION_LIBRARY_PACKAGES, NEXTJS_RULES, type OxlintRuleSeverity, PREACT_RULES, REACT_COMPILER_RULES, REACT_DOCTOR_RULES, REACT_NATIVE_DEPENDENCY_NAMES, REACT_NATIVE_DEPENDENCY_PREFIXES, REACT_NATIVE_RULES, RECOMMENDED_RULES, RULES, type Rule, type RuleFramework, type RulePlugin, type RuleSeverity, type RuleVisitors, TANSTACK_QUERY_RULES, TANSTACK_START_RULES, plugin as default, isReactNativeDependencyName };
//# sourceMappingURL=index.d.ts.map