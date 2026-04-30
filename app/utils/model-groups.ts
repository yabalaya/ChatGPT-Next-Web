export type ModelGroupId =
  | "openai"
  | "claude"
  | "gemini"
  | "deepseek"
  | "glm"
  | "moonshot"
  | "minimax"
  | "qwen"
  | "grok"
  | "xiaomimimo"
  | "doubao"
  | "longcat"
  | "sparkdesk"
  | "wenxin"
  | "hunyuan"
  | "internlm"
  | "step"
  | "yi"
  | "azure"
  | "cohere"
  | "llama"
  | "luma"
  | "kling"
  | "flux"
  | "midjourney"
  | "mistral"
  | "runway"
  | "stability"
  | "suno"
  | "others";

export type ModelIconKey = ModelGroupId | "openai-reasoning";

export type ModelGroup = {
  id: ModelGroupId;
  label: string;
  order: number;
  iconModel: string;
};

export type ModelFamily = ModelGroup & {
  iconKey: ModelIconKey;
};

export const MODEL_GROUPS: ModelGroup[] = [
  { id: "openai", label: "OpenAI", order: 0, iconModel: "gpt-4" },
  { id: "claude", label: "Claude", order: 1, iconModel: "claude" },
  { id: "gemini", label: "Gemini", order: 2, iconModel: "gemini" },
  { id: "deepseek", label: "DeepSeek", order: 10, iconModel: "deepseek" },
  { id: "grok", label: "Grok", order: 11, iconModel: "grok" },
  { id: "moonshot", label: "Kimi", order: 12, iconModel: "moonshot" },
  { id: "minimax", label: "MiniMax", order: 13, iconModel: "abab" },
  { id: "glm", label: "智谱", order: 14, iconModel: "glm" },
  { id: "qwen", label: "千问", order: 15, iconModel: "qwen" },
  { id: "xiaomimimo", label: "小米", order: 16, iconModel: "mimo" },
  { id: "doubao", label: "豆包", order: 17, iconModel: "doubao" },
  { id: "longcat", label: "美团", order: 18, iconModel: "longcat" },
  { id: "sparkdesk", label: "讯飞", order: 19, iconModel: "sparkdesk" },
  { id: "wenxin", label: "文心", order: 20, iconModel: "ernie" },
  { id: "hunyuan", label: "混元", order: 21, iconModel: "hunyuan" },
  { id: "internlm", label: "InternLM", order: 22, iconModel: "internlm" },
  { id: "step", label: "StepFun", order: 23, iconModel: "step" },
  { id: "yi", label: "Yi", order: 24, iconModel: "yi" },
  { id: "mistral", label: "Mistral", order: 32, iconModel: "mistral" },
  { id: "azure", label: "Azure", order: 25, iconModel: "phi-" },
  { id: "cohere", label: "Cohere", order: 26, iconModel: "command" },
  { id: "llama", label: "Llama", order: 27, iconModel: "llama" },
  { id: "luma", label: "Luma", order: 28, iconModel: "luma" },
  { id: "kling", label: "可灵", order: 29, iconModel: "kling" },
  { id: "flux", label: "Flux", order: 30, iconModel: "flux" },
  { id: "midjourney", label: "Midjourney", order: 31, iconModel: "midjourney" },
  { id: "runway", label: "Runway", order: 33, iconModel: "runway" },
  { id: "stability", label: "Stability", order: 34, iconModel: "stability" },
  { id: "suno", label: "Suno", order: 35, iconModel: "suno" },
  { id: "others", label: "Others", order: 999, iconModel: "unknown" },
];

const MODEL_GROUP_BY_ID = MODEL_GROUPS.reduce(
  (groups, group) => {
    groups[group.id] = group;
    return groups;
  },
  {} as Record<ModelGroupId, ModelGroup>,
);

const getGroup = (id: ModelGroupId) => MODEL_GROUP_BY_ID[id];

const normalizeModelName = (modelName?: string) =>
  (modelName || "").trim().toLowerCase();

type ModelGroupRule = {
  groupId: ModelGroupId;
  iconKey?: ModelIconKey;
  test: (model: string) => boolean;
};

const MODEL_GROUP_RULES: ModelGroupRule[] = [
  {
    groupId: "openai",
    iconKey: "openai-reasoning",
    test: (model) => /^(o1|o3)|gpt-(o1|o3)/.test(model),
  },
  {
    groupId: "openai",
    test: (model) => model.includes("gpt"),
  },
  { groupId: "claude", test: (model) => model.includes("claude") },
  {
    groupId: "gemini",
    test: (model) =>
      model.includes("gemini") ||
      model.includes("learnlm") ||
      model.includes("gemma"),
  },
  { groupId: "deepseek", test: (model) => model.includes("deepseek") },
  {
    groupId: "glm",
    test: (model) =>
      model.includes("glm") ||
      model.startsWith("cogview-") ||
      model.startsWith("cogvideox-"),
  },
  {
    groupId: "moonshot",
    test: (model) => model.includes("moonshot") || model.includes("kimi"),
  },
  {
    groupId: "minimax",
    test: (model) => model.includes("abab") || model.includes("minimax"),
  },
  { groupId: "qwen", test: (model) => model.includes("qwen") },
  { groupId: "grok", test: (model) => model.includes("grok") },
  {
    groupId: "xiaomimimo",
    test: (model) => model.includes("xiaomi") || model.includes("mimo"),
  },
  {
    groupId: "doubao",
    test: (model) =>
      model.includes("doubao") ||
      model.startsWith("ep-") ||
      model.startsWith("seed"),
  },
  { groupId: "longcat", test: (model) => model.includes("longcat") },
  { groupId: "sparkdesk", test: (model) => model.includes("spark") },
  {
    groupId: "wenxin",
    test: (model) => model.includes("ernie") || model.includes("wenxin"),
  },
  { groupId: "hunyuan", test: (model) => model.includes("hunyuan") },
  { groupId: "internlm", test: (model) => model.includes("internlm") },
  { groupId: "step", test: (model) => model.includes("step") },
  { groupId: "yi", test: (model) => model.includes("yi") },
  { groupId: "azure", test: (model) => model.includes("phi-") },
  { groupId: "cohere", test: (model) => model.includes("command") },
  { groupId: "llama", test: (model) => model.includes("llama") },
  { groupId: "luma", test: (model) => model.includes("luma") },
  {
    groupId: "kling",
    test: (model) => model.includes("kling") || model.includes("kolors"),
  },
  { groupId: "flux", test: (model) => model.includes("flux") },
  {
    groupId: "midjourney",
    test: (model) => model.includes("midjourney") || model.includes("mj"),
  },
  {
    groupId: "mistral",
    test: (model) =>
      model.includes("mistral") ||
      model.includes("pixtral") ||
      model.includes("codestral"),
  },
  { groupId: "runway", test: (model) => model.includes("runway") },
  {
    groupId: "stability",
    test: (model) =>
      model.includes("stability") ||
      model.includes("stable-diffusion") ||
      model.includes("sd"),
  },
  { groupId: "suno", test: (model) => model.includes("suno") },
];

export function getModelFamily(modelName?: string): ModelFamily {
  const model = normalizeModelName(modelName);
  const rule = MODEL_GROUP_RULES.find((rule) => rule.test(model));
  const group = getGroup(rule?.groupId ?? "others");

  return {
    ...group,
    iconKey: rule?.iconKey ?? group.id,
  };
}

export function getModelGroup(modelName?: string): ModelGroup {
  const family = getModelFamily(modelName);
  return getGroup(family.id);
}

export function compareModelGroups(a: ModelGroup, b: ModelGroup) {
  if (a.order !== b.order) {
    return a.order - b.order;
  }
  return a.label.localeCompare(b.label);
}
