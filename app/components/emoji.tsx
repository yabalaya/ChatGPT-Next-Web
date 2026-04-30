import EmojiPicker, {
  Emoji,
  EmojiStyle,
  Theme as EmojiTheme,
} from "emoji-picker-react";

import { ModelType } from "../store";
import { getModelFamily, ModelIconKey } from "../utils/model-groups";

import BotIcon from "../icons/bot.svg";
import BotIconBlack from "../icons/black-bot.svg";
import BotIconDefault from "../icons/llm-icons/default-ai.svg";
import BotIconAzure from "../icons/llm-icons/azure.svg";
import BotIconClaude from "../icons/llm-icons/claude.svg";
import BotIconCohere from "../icons/llm-icons/cohere.svg";
import BotIconDeepseek from "../icons/llm-icons/deepseek.svg";
import BotIconDoubao from "../icons/llm-icons/doubao.svg";
import BotIconFlux from "../icons/llm-icons/flux.svg";
import BotIconGemini from "../icons/llm-icons/gemini.svg";
import BotIconGLM from "../icons/llm-icons/glm.svg";
import BotIconGrok from "../icons/llm-icons/grok.svg";
import BotIconHunyuan from "../icons/llm-icons/hunyuan.svg";
import BotIconInternlm from "../icons/llm-icons/internlm.svg";
import BotIconKling from "../icons/llm-icons/kling.svg";
import BotIconLlama from "../icons/llm-icons/llama.svg";
import BotIconLongCat from "../icons/llm-icons/longcat.svg";
import BotIconLuma from "../icons/llm-icons/luma.svg";
import BotIconMidjourney from "../icons/llm-icons/midjourney.svg";
import BotIconMinimax from "../icons/llm-icons/minimax.svg";
import BotIconMistral from "../icons/llm-icons/mistral.svg";
import BotIconMoonshot from "../icons/llm-icons/moonshot.svg";
import BotIconQwen from "../icons/llm-icons/qwen.svg";
import BotIconRunway from "../icons/llm-icons/runway.svg";
import BotIconSparkdesk from "../icons/llm-icons/sparkdesk.svg";
import BotIconStability from "../icons/llm-icons/stability.svg";
import BotIconStep from "../icons/llm-icons/stepfun.svg";
import BotIconSuno from "../icons/llm-icons/suno.svg";
import BotIconWenxin from "../icons/llm-icons/wenxin.svg";
import BotIconXiaomiMiMo from "../icons/llm-icons/xiaomimimo.svg";
import BotIconYi from "../icons/llm-icons/yi.svg";

export function getEmojiUrl(unified: string, style: EmojiStyle) {
  // Whoever owns this Content Delivery Network (CDN), I am using your CDN to serve emojis
  // Old CDN broken, so I had to switch to this one
  // Author: https://github.com/H0llyW00dzZ
  return `https://fastly.jsdelivr.net/npm/emoji-datasource-apple/img/${style}/64/${unified}.png`;
}

export function AvatarPicker(props: {
  onEmojiClick: (emojiId: string) => void;
}) {
  return (
    <EmojiPicker
      width={"100%"}
      lazyLoadEmojis
      theme={EmojiTheme.AUTO}
      getEmojiUrl={getEmojiUrl}
      onEmojiClick={(e) => {
        props.onEmojiClick(e.unified);
      }}
    />
  );
}

export function Avatar(props: { model?: ModelType; avatar?: string }) {
  if (props.model) {
    let IconComponent;
    const iconKey: ModelIconKey = getModelFamily(props.model).iconKey;
    switch (iconKey) {
      case "openai-reasoning":
        IconComponent = BotIconBlack;
        break;
      case "openai":
        IconComponent = BotIcon;
        break;
      case "azure":
        IconComponent = BotIconAzure;
        break;
      case "claude":
        IconComponent = BotIconClaude;
        break;
      case "cohere":
        IconComponent = BotIconCohere;
        break;
      case "deepseek":
        IconComponent = BotIconDeepseek;
        break;
      case "doubao":
        IconComponent = BotIconDoubao;
        break;
      case "flux":
        IconComponent = BotIconFlux;
        break;
      case "gemini":
        IconComponent = BotIconGemini;
        break;
      case "glm":
        IconComponent = BotIconGLM;
        break;
      case "grok":
        IconComponent = BotIconGrok;
        break;
      case "xiaomimimo":
        IconComponent = BotIconXiaomiMiMo;
        break;
      case "longcat":
        IconComponent = BotIconLongCat;
        break;
      case "hunyuan":
        IconComponent = BotIconHunyuan;
        break;
      case "internlm":
        IconComponent = BotIconInternlm;
        break;
      case "luma":
        IconComponent = BotIconLuma;
        break;
      case "kling":
        IconComponent = BotIconKling;
        break;
      case "llama":
        IconComponent = BotIconLlama;
        break;
      case "midjourney":
        IconComponent = BotIconMidjourney;
        break;
      case "minimax":
        IconComponent = BotIconMinimax;
        break;
      case "mistral":
        IconComponent = BotIconMistral;
        break;
      case "moonshot":
        IconComponent = BotIconMoonshot;
        break;
      case "qwen":
        IconComponent = BotIconQwen;
        break;
      case "runway":
        IconComponent = BotIconRunway;
        break;
      case "sparkdesk":
        IconComponent = BotIconSparkdesk;
        break;
      case "stability":
        IconComponent = BotIconStability;
        break;
      case "step":
        IconComponent = BotIconStep;
        break;
      case "suno":
        IconComponent = BotIconSuno;
        break;
      case "wenxin":
        IconComponent = BotIconWenxin;
        break;
      case "yi":
        IconComponent = BotIconYi;
        break;
      default:
        IconComponent = BotIconDefault;
    }
    return (
      <div className="no-dark">
        <IconComponent width={30} height={30} />
      </div>
    );
  }

  return (
    <div className="user-avatar">
      {props.avatar && <EmojiAvatar avatar={props.avatar} />}
    </div>
  );
}

export function EmojiAvatar(props: { avatar: string; size?: number }) {
  return (
    <Emoji
      unified={props.avatar}
      size={props.size ?? 18}
      getEmojiUrl={getEmojiUrl}
    />
  );
}
