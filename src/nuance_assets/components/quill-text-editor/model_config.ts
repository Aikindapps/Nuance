// copied from: https://github.com/mlc-ai/web-llm/blob/main/examples/simple-chat/src/gh-config.js
export const modelVersion = "v0_2_30";
export const modelLibURLPrefix =
	"https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/";

  export interface ModelRecord {
    model: string;
    model_id: string;
    model_lib: string;
    overrides?: ChatOptions;
    vram_required_MB?: number;
    low_resource_required?: boolean;
    buffer_size_required_bytes?: number;
    required_features?: Array<string>;
    model_type?: ModelType;
  }
  export enum ModelType {
    "LLM",
    "embedding",
    "VLM", // vision-language model
  }

  export interface ChatOptions extends Partial<ChatConfig> {}
  export interface ChatConfig {
    // First three fields affect the entire conversation, i.e. used in `MLCEngine.reload()`
    tokenizer_files: Array<string>;
    tokenizer_info?: TokenizerInfo;
    token_table_postproc_method?: string; // TODO: backward compatibility, remove soon
    vocab_size: number;
    conv_config?: Partial<ConvTemplateConfig>;
    conv_template: ConvTemplateConfig;
    // KVCache settings
    context_window_size: number;
    sliding_window_size: number;
    attention_sink_size: number;
    // Fields below can be swapped per-generation via `GenerationConfig`
    // Fields only used in MLC
    repetition_penalty: number;
    // Fields shared by MLC and OpenAI APIs
    frequency_penalty: number;
    presence_penalty: number;
    top_p: number;
    temperature: number;
    bos_token_id?: number;
  }

  /**
 * Conversation template config
 */
export interface ConvTemplateConfig {
  system_template: string;
  system_message: string;
  roles: Record<Role, string>;
  role_templates?: Partial<Record<Role, string>>;
  seps: Array<string>;
  role_content_sep?: string;
  role_empty_sep?: string;
  stop_str: Array<string>;
  system_prefix_token_ids?: Array<number>;
  stop_token_ids: Array<number>;
  add_role_after_system_message?: boolean;
}

export enum Role {
  user = "user",
  assistant = "assistant",
  tool = "tool",
}

// export const DefaultLogLevel: LogLevel = "WARN";

/**
 * Place holders that can be used in role templates.
 * For example, a role template of
 * `<<question>> ${MessagePlaceholders.USER} <<function>> ${MessagePlaceholders.FUNCTION}`
 * will insert the user message to ${MessagePlaceholders.USER}
 * and insert the function message to ${MessagePlaceholders.FUNCTION}
 * at run time.
 */
export enum MessagePlaceholders {
  system = "{system_message}",
  user = "{user_message}",
  assistant = "{assistant_message}",
  tool = "{tool_message}",
  function = "{function_string}",
  hermes_tools = "{hermes_tools}",
}

/**
 * Information about the tokenizer. Currently, only `token_postproc_method` is used to
 * post process the token table when using grammar.
 */
export interface TokenizerInfo {
  token_postproc_method: string;
  prepend_space_in_encode: boolean;
  strip_space_in_decode: boolean;
}
  


export const modelConfig = {
	model_list: [
    {
      model: "https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f32_1-MLC",
      model_id: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3.2-1B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 1128.82,
      low_resource_required: true,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC",
      model_id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3.2-1B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 879.04,
      low_resource_required: true,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q0f32-MLC",
      model_id: "Llama-3.2-1B-Instruct-q0f32-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3.2-1B-Instruct-q0f32-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 5106.26,
      low_resource_required: true,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q0f16-MLC",
      model_id: "Llama-3.2-1B-Instruct-q0f16-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3.2-1B-Instruct-q0f16-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 2573.13,
      low_resource_required: true,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Llama-3.2-3B-Instruct-q4f32_1-MLC",
      model_id: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 2951.51,
      low_resource_required: true,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Llama-3.2-3B-Instruct-q4f16_1-MLC",
      model_id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3.2-3B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 2263.69,
      low_resource_required: true,
      overrides: {
        context_window_size: 4096,
      },
    },
    // Llama-3.1
    {
      model: "https://huggingface.co/mlc-ai/Llama-3.1-8B-Instruct-q4f32_1-MLC",
      model_id: "Llama-3.1-8B-Instruct-q4f32_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3_1-8B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 5295.7,
      low_resource_required: true,
      overrides: {
        context_window_size: 1024,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Llama-3.1-8B-Instruct-q4f16_1-MLC",
      model_id: "Llama-3.1-8B-Instruct-q4f16_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 4598.34,
      low_resource_required: true,
      overrides: {
        context_window_size: 1024,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Llama-3.1-8B-Instruct-q4f32_1-MLC",
      model_id: "Llama-3.1-8B-Instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3_1-8B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 6101.01,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Llama-3.1-8B-Instruct-q4f16_1-MLC",
      model_id: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 5001.0,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    // Hermes-2
    {
      model:
        "https://huggingface.co/mlc-ai/Hermes-2-Theta-Llama-3-8B-q4f16_1-MLC",
      model_id: "Hermes-2-Theta-Llama-3-8B-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 4976.13,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/Hermes-2-Theta-Llama-3-8B-q4f32_1-MLC",
      model_id: "Hermes-2-Theta-Llama-3-8B-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3-8B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 6051.27,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC",
      model_id: "Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 4976.13,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/Hermes-2-Pro-Llama-3-8B-q4f32_1-MLC",
      model_id: "Hermes-2-Pro-Llama-3-8B-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3-8B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 6051.27,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Hermes-3-Llama-3.1-8B-q4f32_1-MLC",
      model_id: "Hermes-3-Llama-3.1-8B-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3_1-8B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 5779.27,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Hermes-3-Llama-3.1-8B-q4f16_1-MLC",
      model_id: "Hermes-3-Llama-3.1-8B-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 4876.13,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/Hermes-2-Pro-Mistral-7B-q4f16_1-MLC",
      model_id: "Hermes-2-Pro-Mistral-7B-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Mistral-7B-Instruct-v0.3-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 4033.28,
      low_resource_required: false,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 4096,
        sliding_window_size: -1,
      },
    },
    // Phi3.5-mini-instruct
    {
      model: "https://huggingface.co/mlc-ai/Phi-3.5-mini-instruct-q4f16_1-MLC",
      model_id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Phi-3.5-mini-instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 3672.07,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Phi-3.5-mini-instruct-q4f32_1-MLC",
      model_id: "Phi-3.5-mini-instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Phi-3.5-mini-instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 5483.12,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Phi-3.5-mini-instruct-q4f16_1-MLC",
      model_id: "Phi-3.5-mini-instruct-q4f16_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Phi-3.5-mini-instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 2520.07,
      low_resource_required: true,
      overrides: {
        context_window_size: 1024,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Phi-3.5-mini-instruct-q4f32_1-MLC",
      model_id: "Phi-3.5-mini-instruct-q4f32_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Phi-3.5-mini-instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 3179.12,
      low_resource_required: true,
      overrides: {
        context_window_size: 1024,
      },
    },
    // Phi-3.5-vision-instruct
    {
      model:
        "https://huggingface.co/mlc-ai/Phi-3.5-vision-instruct-q4f16_1-MLC",
      model_id: "Phi-3.5-vision-instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Phi-3.5-vision-instruct-q4f16_1-ctx4k_cs2k-webgpu.wasm",
      vram_required_MB: 3952.18,
      low_resource_required: true,
      overrides: {
        context_window_size: 4096,
      },
      model_type: ModelType.VLM,
    },
    {
      model:
        "https://huggingface.co/mlc-ai/Phi-3.5-vision-instruct-q4f32_1-MLC",
      model_id: "Phi-3.5-vision-instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Phi-3.5-vision-instruct-q4f32_1-ctx4k_cs2k-webgpu.wasm",
      vram_required_MB: 5879.84,
      low_resource_required: true,
      overrides: {
        context_window_size: 4096,
      },
      model_type: ModelType.VLM,
    },
    // Mistral variants
    {
      model:
        "https://huggingface.co/mlc-ai/Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
      model_id: "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Mistral-7B-Instruct-v0.3-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 4573.39,
      low_resource_required: false,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 4096,
        sliding_window_size: -1,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/Mistral-7B-Instruct-v0.3-q4f32_1-MLC",
      model_id: "Mistral-7B-Instruct-v0.3-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Mistral-7B-Instruct-v0.3-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 5619.27,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
        sliding_window_size: -1,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/Mistral-7B-Instruct-v0.2-q4f16_1-MLC",
      model_id: "Mistral-7B-Instruct-v0.2-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Mistral-7B-Instruct-v0.3-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 4573.39,
      low_resource_required: false,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 4096,
        sliding_window_size: -1,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/OpenHermes-2.5-Mistral-7B-q4f16_1-MLC",
      model_id: "OpenHermes-2.5-Mistral-7B-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Mistral-7B-Instruct-v0.3-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 4573.39,
      low_resource_required: false,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 4096,
        sliding_window_size: -1,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/NeuralHermes-2.5-Mistral-7B-q4f16_1-MLC",
      model_id: "NeuralHermes-2.5-Mistral-7B-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Mistral-7B-Instruct-v0.3-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 4573.39,
      low_resource_required: false,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 4096,
        sliding_window_size: -1,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/WizardMath-7B-V1.1-q4f16_1-MLC",
      model_id: "WizardMath-7B-V1.1-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Mistral-7B-Instruct-v0.3-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 4573.39,
      low_resource_required: false,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 4096,
        sliding_window_size: -1,
      },
    },
    // SmolLM2
    {
      model: "https://huggingface.co/mlc-ai/SmolLM2-1.7B-Instruct-q4f16_1-MLC",
      model_id: "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/SmolLM2-1.7B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 1774.19,
      low_resource_required: true,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/SmolLM2-1.7B-Instruct-q4f32_1-MLC",
      model_id: "SmolLM2-1.7B-Instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/SmolLM2-1.7B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 2692.38,
      low_resource_required: true,
      overrides: {
        context_window_size: 4096,
      },
    },

    {
      model: "https://huggingface.co/mlc-ai/SmolLM2-360M-Instruct-q0f16-MLC",
      model_id: "SmolLM2-360M-Instruct-q0f16-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/SmolLM2-360M-Instruct-q0f16-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 871.99,
      low_resource_required: true,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/SmolLM2-360M-Instruct-q0f32-MLC",
      model_id: "SmolLM2-360M-Instruct-q0f32-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/SmolLM2-360M-Instruct-q0f32-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 1743.99,
      low_resource_required: true,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/SmolLM2-360M-Instruct-q4f16_1-MLC",
      model_id: "SmolLM2-360M-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/SmolLM2-360M-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 376.06,
      low_resource_required: true,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/SmolLM2-360M-Instruct-q4f32_1-MLC",
      model_id: "SmolLM2-360M-Instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/SmolLM2-360M-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 579.61,
      low_resource_required: true,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/SmolLM2-135M-Instruct-q0f16-MLC",
      model_id: "SmolLM2-135M-Instruct-q0f16-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/SmolLM2-135M-Instruct-q0f16-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 359.69,
      low_resource_required: true,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/SmolLM2-135M-Instruct-q0f32-MLC",
      model_id: "SmolLM2-135M-Instruct-q0f32-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/SmolLM2-135M-Instruct-q0f32-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 719.38,
      low_resource_required: true,
      overrides: {
        context_window_size: 4096,
      },
    },
    // Gemma2
    {
      model: "https://huggingface.co/mlc-ai/gemma-2-2b-it-q4f16_1-MLC",
      model_id: "gemma-2-2b-it-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/gemma-2-2b-it-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 1895.3,
      low_resource_required: false,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/gemma-2-2b-it-q4f32_1-MLC",
      model_id: "gemma-2-2b-it-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/gemma-2-2b-it-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 2508.75,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/gemma-2-2b-it-q4f16_1-MLC",
      model_id: "gemma-2-2b-it-q4f16_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/gemma-2-2b-it-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 1583.3,
      low_resource_required: true,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 1024,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/gemma-2-2b-it-q4f32_1-MLC",
      model_id: "gemma-2-2b-it-q4f32_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/gemma-2-2b-it-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 1884.75,
      low_resource_required: true,
      overrides: {
        context_window_size: 1024,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/gemma-2-9b-it-q4f16_1-MLC",
      model_id: "gemma-2-9b-it-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/gemma-2-9b-it-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 6422.01,
      low_resource_required: false,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/gemma-2-9b-it-q4f32_1-MLC",
      model_id: "gemma-2-9b-it-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/gemma-2-9b-it-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 8383.33,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    // Gemma2-2b-jpn
    {
      model: "https://huggingface.co/mlc-ai/gemma-2-2b-jpn-it-q4f16_1-MLC",
      model_id: "gemma-2-2b-jpn-it-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/gemma-2-2b-jpn-it-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 1895.3,
      low_resource_required: true,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/gemma-2-2b-jpn-it-q4f32_1-MLC",
      model_id: "gemma-2-2b-jpn-it-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/gemma-2-2b-jpn-it-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 2508.75,
      low_resource_required: true,
      overrides: {
        context_window_size: 4096,
      },
    },
    // Qwen-2
    {
      model: "https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
      model_id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-0.5B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 944.62,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q4f32_1-MLC",
      model_id: "Qwen2.5-0.5B-Instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-0.5B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 1060.2,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q0f16-MLC",
      model_id: "Qwen2.5-0.5B-Instruct-q0f16-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-0.5B-Instruct-q0f16-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 1624.12,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q0f32-MLC",
      model_id: "Qwen2.5-0.5B-Instruct-q0f32-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-0.5B-Instruct-q0f32-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 2654.75,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
      model_id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-1.5B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 1629.75,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Qwen2.5-1.5B-Instruct-q4f32_1-MLC",
      model_id: "Qwen2.5-1.5B-Instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-1.5B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 1888.97,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Qwen2.5-3B-Instruct-q4f16_1-MLC",
      model_id: "Qwen2.5-3B-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2.5-3B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 2504.76,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Qwen2.5-3B-Instruct-q4f32_1-MLC",
      model_id: "Qwen2.5-3B-Instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2.5-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 2893.64,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Qwen2.5-7B-Instruct-q4f16_1-MLC",
      model_id: "Qwen2.5-7B-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-7B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: false,
      vram_required_MB: 5106.67,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Qwen2.5-7B-Instruct-q4f32_1-MLC",
      model_id: "Qwen2.5-7B-Instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-7B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: false,
      vram_required_MB: 5900.09,
      overrides: {
        context_window_size: 4096,
      },
    },
    // Qwen2.5-Coder
    {
      model:
        "https://huggingface.co/mlc-ai/Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC",
      model_id: "Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-0.5B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 944.62,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/Qwen2.5-Coder-0.5B-Instruct-q4f32_1-MLC",
      model_id: "Qwen2.5-Coder-0.5B-Instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-0.5B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 1060.2,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/Qwen2.5-Coder-0.5B-Instruct-q0f16-MLC",
      model_id: "Qwen2.5-Coder-0.5B-Instruct-q0f16-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-0.5B-Instruct-q0f16-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 1624.12,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/Qwen2.5-Coder-0.5B-Instruct-q0f32-MLC",
      model_id: "Qwen2.5-Coder-0.5B-Instruct-q0f32-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-0.5B-Instruct-q0f32-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 2654.75,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC",
      model_id: "Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-1.5B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: false,
      vram_required_MB: 1629.75,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/Qwen2.5-Coder-1.5B-Instruct-q4f32_1-MLC",
      model_id: "Qwen2.5-Coder-1.5B-Instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-1.5B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: false,
      vram_required_MB: 1888.97,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC",
      model_id: "Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2.5-3B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 2504.76,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/Qwen2.5-Coder-3B-Instruct-q4f32_1-MLC",
      model_id: "Qwen2.5-Coder-3B-Instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2.5-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 2893.64,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC",
      model_id: "Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-7B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: false,
      vram_required_MB: 5106.67,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/Qwen2.5-Coder-7B-Instruct-q4f32_1-MLC",
      model_id: "Qwen2.5-Coder-7B-Instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-7B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: false,
      vram_required_MB: 5900.09,
      overrides: {
        context_window_size: 4096,
      },
    },
    // Qwen2.5-Math
    {
      model:
        "https://huggingface.co/mlc-ai/Qwen2.5-Math-1.5B-Instruct-q4f16_1-MLC",
      model_id: "Qwen2.5-Math-1.5B-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-1.5B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 1629.75,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/Qwen2.5-Math-1.5B-Instruct-q4f32_1-MLC",
      model_id: "Qwen2.5-Math-1.5B-Instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-1.5B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 1888.97,
      overrides: {
        context_window_size: 4096,
      },
    },
    // StableLM-zephyr-1.6B
    {
      model: "https://huggingface.co/mlc-ai/stablelm-2-zephyr-1_6b-q4f16_1-MLC",
      model_id: "stablelm-2-zephyr-1_6b-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/stablelm-2-zephyr-1_6b-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 2087.66,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/stablelm-2-zephyr-1_6b-q4f32_1-MLC",
      model_id: "stablelm-2-zephyr-1_6b-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/stablelm-2-zephyr-1_6b-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 2999.33,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/stablelm-2-zephyr-1_6b-q4f16_1-MLC",
      model_id: "stablelm-2-zephyr-1_6b-q4f16_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/stablelm-2-zephyr-1_6b-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 1511.66,
      low_resource_required: true,
      overrides: {
        context_window_size: 1024,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/stablelm-2-zephyr-1_6b-q4f32_1-MLC",
      model_id: "stablelm-2-zephyr-1_6b-q4f32_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/stablelm-2-zephyr-1_6b-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 1847.33,
      low_resource_required: true,
      overrides: {
        context_window_size: 1024,
      },
    },
    // RedPajama
    {
      model:
        "https://huggingface.co/mlc-ai/RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC",
      model_id: "RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/RedPajama-INCITE-Chat-3B-v1-q4f16_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 2972.09,
      low_resource_required: false,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 2048,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/RedPajama-INCITE-Chat-3B-v1-q4f32_1-MLC",
      model_id: "RedPajama-INCITE-Chat-3B-v1-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/RedPajama-INCITE-Chat-3B-v1-q4f32_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 3928.09,
      low_resource_required: false,
      overrides: {
        context_window_size: 2048,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC",
      model_id: "RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/RedPajama-INCITE-Chat-3B-v1-q4f16_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 2041.09,
      low_resource_required: true,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 1024,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/RedPajama-INCITE-Chat-3B-v1-q4f32_1-MLC",
      model_id: "RedPajama-INCITE-Chat-3B-v1-q4f32_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/RedPajama-INCITE-Chat-3B-v1-q4f32_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 2558.09,
      low_resource_required: true,
      overrides: {
        context_window_size: 1024,
      },
    },
    // TinyLlama v1.0
    {
      model:
        "https://huggingface.co/mlc-ai/TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
      model_id: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/TinyLlama-1.1B-Chat-v1.0-q4f16_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 697.24,
      low_resource_required: true,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 2048,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC",
      model_id: "TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/TinyLlama-1.1B-Chat-v1.0-q4f32_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 839.98,
      low_resource_required: true,
      overrides: {
        context_window_size: 2048,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
      model_id: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/TinyLlama-1.1B-Chat-v1.0-q4f16_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 675.24,
      low_resource_required: true,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 1024,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC",
      model_id: "TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/TinyLlama-1.1B-Chat-v1.0-q4f32_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 795.98,
      low_resource_required: true,
      overrides: {
        context_window_size: 1024,
      },
    },
    // BELOW ARE MODELS OF OLDER VERSIONS OR NOT AS PRACTICAL
    // Llama-3.1 70B
    {
      model: "https://huggingface.co/mlc-ai/Llama-3.1-70B-Instruct-q3f16_1-MLC",
      model_id: "Llama-3.1-70B-Instruct-q3f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3_1-70B-Instruct-q3f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 31153.13,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    // Qwen-2
    {
      model: "https://huggingface.co/mlc-ai/Qwen2-0.5B-Instruct-q4f16_1-MLC",
      model_id: "Qwen2-0.5B-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-0.5B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 944.62,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Qwen2-0.5B-Instruct-q0f16-MLC",
      model_id: "Qwen2-0.5B-Instruct-q0f16-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-0.5B-Instruct-q0f16-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 1624.12,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Qwen2-0.5B-Instruct-q0f32-MLC",
      model_id: "Qwen2-0.5B-Instruct-q0f32-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-0.5B-Instruct-q0f32-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 2654.75,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Qwen2-1.5B-Instruct-q4f16_1-MLC",
      model_id: "Qwen2-1.5B-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-1.5B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 1629.75,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Qwen2-1.5B-Instruct-q4f32_1-MLC",
      model_id: "Qwen2-1.5B-Instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-1.5B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 1888.97,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Qwen2-7B-Instruct-q4f16_1-MLC",
      model_id: "Qwen2-7B-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-7B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: false,
      vram_required_MB: 5106.67,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Qwen2-7B-Instruct-q4f32_1-MLC",
      model_id: "Qwen2-7B-Instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-7B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: false,
      vram_required_MB: 5900.09,
      overrides: {
        context_window_size: 4096,
      },
    },
    // Qwen2-Math
    {
      model:
        "https://huggingface.co/mlc-ai/Qwen2-Math-1.5B-Instruct-q4f16_1-MLC",
      model_id: "Qwen2-Math-1.5B-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-1.5B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 1629.75,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/Qwen2-Math-1.5B-Instruct-q4f32_1-MLC",
      model_id: "Qwen2-Math-1.5B-Instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-1.5B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: true,
      vram_required_MB: 1888.97,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Qwen2-Math-7B-Instruct-q4f16_1-MLC",
      model_id: "Qwen2-Math-7B-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-7B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: false,
      vram_required_MB: 5106.67,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Qwen2-Math-7B-Instruct-q4f32_1-MLC",
      model_id: "Qwen2-Math-7B-Instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Qwen2-7B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      low_resource_required: false,
      vram_required_MB: 5900.09,
      overrides: {
        context_window_size: 4096,
      },
    },
    // Llama-3
    {
      model: "https://huggingface.co/mlc-ai/Llama-3-8B-Instruct-q4f32_1-MLC",
      model_id: "Llama-3-8B-Instruct-q4f32_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3-8B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 5295.7,
      low_resource_required: true,
      overrides: {
        context_window_size: 1024,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Llama-3-8B-Instruct-q4f16_1-MLC",
      model_id: "Llama-3-8B-Instruct-q4f16_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 4598.34,
      low_resource_required: true,
      overrides: {
        context_window_size: 1024,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Llama-3-8B-Instruct-q4f32_1-MLC",
      model_id: "Llama-3-8B-Instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3-8B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 6101.01,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Llama-3-8B-Instruct-q4f16_1-MLC",
      model_id: "Llama-3-8B-Instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 5001.0,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Llama-3-70B-Instruct-q3f16_1-MLC",
      model_id: "Llama-3-70B-Instruct-q3f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-3-70B-Instruct-q3f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 31153.13,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    // Phi3-mini-instruct
    {
      model: "https://huggingface.co/mlc-ai/Phi-3-mini-4k-instruct-q4f16_1-MLC",
      model_id: "Phi-3-mini-4k-instruct-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Phi-3-mini-4k-instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 3672.07,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Phi-3-mini-4k-instruct-q4f32_1-MLC",
      model_id: "Phi-3-mini-4k-instruct-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Phi-3-mini-4k-instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 5483.12,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Phi-3-mini-4k-instruct-q4f16_1-MLC",
      model_id: "Phi-3-mini-4k-instruct-q4f16_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Phi-3-mini-4k-instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 2520.07,
      low_resource_required: true,
      overrides: {
        context_window_size: 1024,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Phi-3-mini-4k-instruct-q4f32_1-MLC",
      model_id: "Phi-3-mini-4k-instruct-q4f32_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Phi-3-mini-4k-instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 3179.12,
      low_resource_required: true,
      overrides: {
        context_window_size: 1024,
      },
    },
    // Llama-2
    {
      model: "https://huggingface.co/mlc-ai/Llama-2-7b-chat-hf-q4f32_1-MLC",
      model_id: "Llama-2-7b-chat-hf-q4f32_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 5284.01,
      low_resource_required: false,
      overrides: {
        context_window_size: 1024,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Llama-2-7b-chat-hf-q4f16_1-MLC",
      model_id: "Llama-2-7b-chat-hf-q4f16_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-2-7b-chat-hf-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 4618.52,
      low_resource_required: false,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 1024,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Llama-2-7b-chat-hf-q4f32_1-MLC",
      model_id: "Llama-2-7b-chat-hf-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 9109.03,
      low_resource_required: false,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Llama-2-7b-chat-hf-q4f16_1-MLC",
      model_id: "Llama-2-7b-chat-hf-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-2-7b-chat-hf-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 6749.02,
      low_resource_required: false,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/Llama-2-13b-chat-hf-q4f16_1-MLC",
      model_id: "Llama-2-13b-chat-hf-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/Llama-2-13b-chat-hf-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 11814.09,
      low_resource_required: false,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 4096,
      },
    },
    // Gemma-2B
    {
      model: "https://huggingface.co/mlc-ai/gemma-2b-it-q4f16_1-MLC",
      model_id: "gemma-2b-it-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/gemma-2b-it-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 1476.52,
      low_resource_required: false,
      buffer_size_required_bytes: 262144000,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/gemma-2b-it-q4f32_1-MLC",
      model_id: "gemma-2b-it-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/gemma-2b-it-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 1750.66,
      low_resource_required: false,
      buffer_size_required_bytes: 262144000,
      overrides: {
        context_window_size: 4096,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/gemma-2b-it-q4f16_1-MLC",
      model_id: "gemma-2b-it-q4f16_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/gemma-2b-it-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 1476.52,
      low_resource_required: true,
      buffer_size_required_bytes: 262144000,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 1024,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/gemma-2b-it-q4f32_1-MLC",
      model_id: "gemma-2b-it-q4f32_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/gemma-2b-it-q4f32_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 1750.66,
      low_resource_required: true,
      buffer_size_required_bytes: 262144000,
      overrides: {
        context_window_size: 1024,
      },
    },
    // Phi-2
    {
      model: "https://huggingface.co/mlc-ai/phi-2-q4f16_1-MLC",
      model_id: "phi-2-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/phi-2-q4f16_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 3053.97,
      low_resource_required: false,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 2048,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/phi-2-q4f32_1-MLC",
      model_id: "phi-2-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/phi-2-q4f32_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 4032.48,
      low_resource_required: false,
      overrides: {
        context_window_size: 2048,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/phi-2-q4f16_1-MLC",
      model_id: "phi-2-q4f16_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/phi-2-q4f16_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 2131.97,
      low_resource_required: true,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 1024,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/phi-2-q4f32_1-MLC",
      model_id: "phi-2-q4f32_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/phi-2-q4f32_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 2740.48,
      low_resource_required: true,
      overrides: {
        context_window_size: 1024,
      },
    },
    // Phi-1.5
    {
      model: "https://huggingface.co/mlc-ai/phi-1_5-q4f16_1-MLC",
      model_id: "phi-1_5-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/phi-1_5-q4f16_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 1210.09,
      low_resource_required: true,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 2048,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/phi-1_5-q4f32_1-MLC",
      model_id: "phi-1_5-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/phi-1_5-q4f32_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 1682.09,
      low_resource_required: true,
      overrides: {
        context_window_size: 2048,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/phi-1_5-q4f16_1-MLC",
      model_id: "phi-1_5-q4f16_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/phi-1_5-q4f16_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 1210.09,
      low_resource_required: true,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 1024,
      },
    },
    {
      model: "https://huggingface.co/mlc-ai/phi-1_5-q4f32_1-MLC",
      model_id: "phi-1_5-q4f32_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/phi-1_5-q4f32_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 1682.09,
      low_resource_required: true,
      overrides: {
        context_window_size: 1024,
      },
    },
    // TinyLlama v0.4
    {
      model:
        "https://huggingface.co/mlc-ai/TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC",
      model_id: "TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/TinyLlama-1.1B-Chat-v0.4-q4f16_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 697.24,
      low_resource_required: true,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 2048,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC",
      model_id: "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/TinyLlama-1.1B-Chat-v0.4-q4f32_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 839.98,
      low_resource_required: true,
      overrides: {
        context_window_size: 2048,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC",
      model_id: "TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/TinyLlama-1.1B-Chat-v0.4-q4f16_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 675.24,
      low_resource_required: true,
      required_features: ["shader-f16"],
      overrides: {
        context_window_size: 1024,
      },
    },
    {
      model:
        "https://huggingface.co/mlc-ai/TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC",
      model_id: "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC-1k",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/TinyLlama-1.1B-Chat-v0.4-q4f32_1-ctx2k_cs1k-webgpu.wasm",
      vram_required_MB: 795.98,
      low_resource_required: true,
      overrides: {
        context_window_size: 1024,
      },
    },
    // Embedding models
    // -b means max_batch_size this model allows. The smaller it is, the less memory the model consumes.
    {
      model: "https://huggingface.co/mlc-ai/snowflake-arctic-embed-m-q0f32-MLC",
      model_id: "snowflake-arctic-embed-m-q0f32-MLC-b32",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/snowflake-arctic-embed-m-q0f32-ctx512_cs512_batch32-webgpu.wasm",
      vram_required_MB: 1407.51,
      model_type: ModelType.embedding,
    },
    {
      model: "https://huggingface.co/mlc-ai/snowflake-arctic-embed-m-q0f32-MLC",
      model_id: "snowflake-arctic-embed-m-q0f32-MLC-b4",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/snowflake-arctic-embed-m-q0f32-ctx512_cs512_batch4-webgpu.wasm",
      vram_required_MB: 539.4,
      model_type: ModelType.embedding,
    },
    {
      model: "https://huggingface.co/mlc-ai/snowflake-arctic-embed-s-q0f32-MLC",
      model_id: "snowflake-arctic-embed-s-q0f32-MLC-b32",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/snowflake-arctic-embed-s-q0f32-ctx512_cs512_batch32-webgpu.wasm",
      vram_required_MB: 1022.82,
      model_type: ModelType.embedding,
    },
    {
      model: "https://huggingface.co/mlc-ai/snowflake-arctic-embed-s-q0f32-MLC",
      model_id: "snowflake-arctic-embed-s-q0f32-MLC-b4",
      model_lib:
        modelLibURLPrefix +
        modelVersion +
        "/snowflake-arctic-embed-s-q0f32-ctx512_cs512_batch4-webgpu.wasm",
      vram_required_MB: 238.71,
      model_type: ModelType.embedding,
    },
  ],
	/* model_lib_map: {
		"Llama-3-8B-Instruct-q4f32_1": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_30/Llama-3-8B-Instruct-q4f32_1-ctx1k_cs1k-webgpu.wasm",
		"Llama-3-8B-Instruct-q4f32_1-1k": modelLibURLPrefix + modelVersion + "/Llama-3-8B-Instruct-q4f32_1-ctx1k_cs1k-webgpu.wasm",
		"Llama-3-70B-Instruct-q3f16_1": modelLibURLPrefix + modelVersion + "/Llama-3-70B-Instruct-q3f16_1-ctx4k_cs1k-webgpu.wasm",			
		"Llama-2-7b-chat-hf-q4f32_1": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-2-7b-chat-hf-q4f32_1-webgpu.wasm",
		"Llama-2-7b-chat-hf-q4f16_1": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-2-7b-chat-hf-q4f16_1-webgpu.wasm",
		"Llama-2-13b-chat-hf-q4f16_1": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-2-13b-chat-hf-q4f16_1-webgpu.wasm",
		"Llama-2-70b-chat-hf-q4f16_1": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-2-70b-chat-hf-q4f16_1-webgpu.wasm",
		"RedPajama-INCITE-Chat-3B-v1-q4f32_1": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/RedPajama-INCITE-Chat-3B-v1-q4f32_1-webgpu.wasm",
		"RedPajama-INCITE-Chat-3B-v1-q4f16_1": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/RedPajama-INCITE-Chat-3B-v1-q4f16_1-webgpu.wasm",
		"WizardCoder-15B-V1.0-q4f16_1": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/WizardCoder-15B-V1.0-q4f16_1-webgpu.wasm",
		"WizardMath-7B-V1.0-q4f16_1": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-2-7b-chat-hf-q4f16_1-webgpu.wasm",
		"WizardMath-7B-V1.0-q4f32_1": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-2-7b-chat-hf-q4f32_1-webgpu.wasm",
		"WizardMath-13B-V1.0-q4f16_1": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-2-13b-chat-hf-q4f16_1-webgpu.wasm",
		"WizardMath-70B-V1.0-q4f16_1": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-2-70b-chat-hf-q4f16_1-webgpu.wasm",
		"Mistral-7B-Instruct-v0.1-q4f16_1": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Mistral-7B-Instruct-v0.1-q4f16_1-sw4k_cs1k-webgpu.wasm",
		"OpenHermes-2.5-Mistral-7B-q4f16_1": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Mistral-7B-Instruct-v0.1-q4f32_1-sw4k_cs1k-webgpu.wasm",
		"OpenHermes-2.5-Mistral-7B-q4f32_1": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Mistral-7B-Instruct-v0.1-q4f32_1-sw4k_cs1k-webgpu.wasm",
		"NeuralHermes-2.5-Mistral-7B-q4f16_1": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Mistral-7B-Instruct-v0.1-q4f32_1-sw4k_cs1k-webgpu.wasm",
		"NeuralHermes-2.5-Mistral-7B-q4f32_1": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Mistral-7B-Instruct-v0.1-q4f32_1-sw4k_cs1k-webgpu.wasm",
		// Models below fit for 128MB buffer limit (e.g. webgpu on Android)
		"Llama-2-7b-chat-hf-q4f16_1-1k": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-2-7b-chat-hf-q4f16_1-1k-webgpu.wasm",
		"RedPajama-INCITE-Chat-3B-v1-q4f16_1-1k": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/RedPajama-INCITE-Chat-3B-v1-q4f16_1-1k-webgpu.wasm",
		"RedPajama-INCITE-Chat-3B-v1-q4f32_1-1k": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/RedPajama-INCITE-Chat-3B-v1-q4f32_1-1k-webgpu.wasm",
	}, */
	//"use_web_worker": true
}