import { evaluateScalar, evaluateVector, quaternionZDegrees } from "./curve-runtime.js";
import { INTRO_CONFIG } from "./intro-config.js";

/* ------------------------------------------------------------
   素材 CDN 加速（大陆访客 github.io 直连很慢，见 intro-config.js）
   所有素材地址统一走 assetUrl()：配了 CDN 就优先走 CDN，
   加载失败自动回退到与本站同源的文件，保证永远不会白屏。
   ------------------------------------------------------------ */
const CDN_BASE = String(INTRO_CONFIG.assetCdnBase || "").replace(/\/*$/, "/");

/** 素材相对路径 → 完整地址（中文与空格自动转码） */
function assetUrl(url) {
  if (!CDN_BASE) return encodeURI(url);
  return encodeURI(CDN_BASE + url.replace(/^\.\//, ""));
}

/* scene-data.js 约 350KB，优先走 CDN，失败回退同源。
   动态 import 是为了拿到"失败后重试"的机会。 */
let sceneData;
try {
  ({ sceneData } = await import(assetUrl("scene-data.js")));
} catch {
  ({ sceneData } = await import("./scene-data.js"));
}

const stage = document.querySelector("#stage");
const scaler = document.querySelector("#stage-scaler");
const loading = document.querySelector("#loading");
const query = new URLSearchParams(location.search);

/* ============================================================
   运行模式判定
   ------------------------------------------------------------
   独立打开本页   → 播完后按 intro-config.js 的 redirectUrl 跳转
   被主页 iframe 嵌入 → 播完不跳转，改为给主页发消息，
                        由 overlay.js 淡出覆盖层，露出主页正文
   ------------------------------------------------------------ */
const embedParam = query.get("embed");
const EMBEDDED = embedParam === "1"
  ? true
  : (embedParam === "0" ? false : window.parent !== window);
/** 与主页 overlay.js 约定的消息标记，两边必须一致 */
const EMBED_MESSAGE_SOURCE = "ak-act54-intro";

/** 给主页（父窗口）发一条消息：ready = 资源就绪，done = 动画收场 */
function postToHost(type) {
  if (!EMBEDDED || window.parent === window) return;
  try {
    window.parent.postMessage({ source: EMBED_MESSAGE_SOURCE, type }, "*");
  } catch { /* 跨域等异常直接忽略，不影响动画播放 */ }
}

/* ============================================================
   站点开场动画定制逻辑
   配置项见 intro-config.js，这里只负责执行
   ============================================================ */
const DEBUG = INTRO_CONFIG.enableDebugQuery && query.get("debug") === "1";
const redirectQuery = INTRO_CONFIG.enableDebugQuery ? query.get("redirect") : null;
const atQuery = INTRO_CONFIG.enableDebugQuery ? query.get("at") : null;
const frameQuery = INTRO_CONFIG.enableDebugQuery ? query.get("t") : null;

/** 跳转目标：?redirect=0 关闭跳转；?redirect=<url> 临时覆盖 */
const REDIRECT_URL = redirectQuery === "0"
  ? ""
  : (redirectQuery || INTRO_CONFIG.redirectUrl);
/** 第几秒收场（定格后通知主页 / 跳转） */
const REDIRECT_AT_SECONDS = Math.min(
  Number(atQuery ?? INTRO_CONFIG.redirectAtSeconds) || 0,
  sceneData.duration,
);

/** 收场方式：notify = 通知主页淡出；navigate = 跳转到 redirectUrl；none = 不动 */
const END_ACTION = EMBEDDED ? "notify" : (REDIRECT_URL ? "navigate" : "none");

let isFinishing = false;

/* 淡出遮罩：跳转前铺一层黑场，衔接更像游戏自身的转场 */
const fadeOverlay = document.createElement("div");
fadeOverlay.id = "intro-fade";
fadeOverlay.setAttribute("aria-hidden", "true");
document.body.append(fadeOverlay);

function finishIntro() {
  if (isFinishing || END_ACTION === "none") return;
  isFinishing = true;
  playing = false;
  cancelAnimationFrame(animationFrame);

  if (DEBUG) console.log("[intro] finishIntro ->", END_ACTION);

  /* 被主页嵌入：立刻告诉主页「动画结束了」，由 overlay.js 淡出覆盖层。
     这里不自己铺黑场，否则会先黑一下再淡出，反而不连贯。 */
  if (END_ACTION === "notify") {
    postToHost("done");
    return;
  }

  /* 独立运行：铺一层黑场再跳转，衔接更像游戏自身的转场 */
  const fadeMs = Math.max(0, INTRO_CONFIG.fadeOutMs);
  if (fadeMs > 0) {
    fadeOverlay.style.transition = `opacity ${fadeMs}ms ease-out`;
    // 下一帧再改透明度，保证过渡生效
    requestAnimationFrame(() => fadeOverlay.classList.add("is-visible"));
    setTimeout(go, fadeMs);
  } else {
    go();
  }

  function go() {
    if (DEBUG) console.log("[intro] replace ->", REDIRECT_URL);
    // replace 而不是 href：不留历史记录，用户点返回不会又被弹回开场动画
    location.replace(REDIRECT_URL);
  }
}

/** 剪辑里自带的「月行水上」活动主界面，按配置整段隐藏 */
const FRONT_UI_PREFIXES = [
  "panel_front_ui",
  "panel_topmenu",
  "circle_desc",
  "non_drawing_graphic",
];

/* ------------------------------------------------------------
   精简版专用：不加载的贴图清单。
   动画只播到 3.79s（黑圆眼睛转场），经逐帧实测（含遮罩
   着色层），下列 54 张贴图在 0–3.79s 内从未显示（活动主
   界面按钮、玻璃反光、闪光、部分水波帧等），跳过加载：
   省约 0.65MB、54 个请求，且这些文件已从仓库删除。
   ⚠️ 若把 redirectAtSeconds 改回 6.5 播完整段，
      请清空这个清单（改成 new Set()）并还原图片文件，
      否则结尾画面会缺图。
   ------------------------------------------------------------ */
const SKIP_SPRITE_FILES = new Set([
  "bg2_back_text_1.png",
  "bg2_back_text_2$0.png",
  "bg2_back_text_nom.png",
  "bg2_back_text_nom_line.png",
  "bg2_back_text_ton.png",
  "bg2_back_text_ton_line$0.png",
  "bg2_desc_2.png",
  "bg2_desc_3$0.png",
  "bg2_mp3.png",
  "bg2_mp3_line_1.png",
  "bg2_mp3_line_2.png",
  "btn_fav$0.png",
  "btn_fortune.png",
  "btn_fortune_bg$0.png",
  "btn_fortune_end$0.png",
  "btn_fortune_lock.png",
  "btn_fortune_new1$0.png",
  "btn_fortune_new2$0.png",
  "btn_mission$0.png",
  "btn_shop.png",
  "btn_zone$0.png",
  "btn_zone_end$0.png",
  "btn_zone_ex$0.png",
  "btn_zone_ex_end$0.png",
  "btn_zone_ex_lock$0.png",
  "desc_sprite$0.png",
  "flassh.png",
  "flassh_0$0.png",
  "flassh_1.png",
  "flassh_2$0.png",
  "flassh_3$0.png",
  "flassh_4$0.png",
  "glass_1$0.png",
  "glass_2$0.png",
  "glass_3$0.png",
  "glass_4$0.png",
  "glass_5$0.png",
  "glass_6$0.png",
  "glass_7.png",
  "img_daily$0.png",
  "img_new.png",
  "music_line_01$0.png",
  "music_line_02.png",
  "music_line_03.png",
  "music_line_04$0.png",
  "music_line_05.png",
  "now_play.png",
  "token$0.png",
  "water_1$1.png",
  "water_2$0.png",
  "water_3$1.png",
  "water_4.png",
  "water_5.png",
  "water_6.png",
]);

const REFERENCE_VIEWPORT = [1280, 720];
const OUTPUT_SCALE = sceneData.viewport[0] / REFERENCE_VIEWPORT[0];

const nodes = new Map();
const imagePromises = [];
let nextNodeId = 0;
let currentTime = 0;
let playing = false;
let startedAt = 0;
let animationFrame = 0;
let loop = query.get("loop") === "1";

const CIRCLE_MATERIAL_PATHS = new Set([
  "panel_front_ui/group_left/btn_card/bg",
  "root_bg/char_mask_c1",
  "root_bg/group_bkg_1/circle_blue_c1",
  "root_bg/group_bkg_1/circle_blue_c1/circle_blue_c3",
  "root_bg/group_bkg_1/group_bg/moon_mask_c2",
  "root_bg/group_bkg_1/group_bg/circle_tiny/circle_mask",
  "root_bg/bg_cover/light_1",
  "root_bg/bg_cover/light_2",
  "root_bg/group_bkg_2/bg1_col_c6",
  "root_bg/group_bkg_2/circle_outline_1",
  "root_bg/group_bkg_2/large_mask/trans_bg_cover_c5",
  "root_bg/group_bkg_2/large_mask/bg_mask_c4",
  "root_bg/group_bkg_2/bg1_col_c7",
  "root_bg/group_bkg_2/circle_outline_2",
  "root_bg/group_bkg_2/bg_2_back/bg_2_c4",
  "root_bg/group_bkg_2/bg_2/bg_2_copy",
  "root_bg/group_bkg_2/bg_2/light_1_c4",
  "root_bg/group_bkg_2/bg_2/light_2_c4",
  "root_bg/group_bkg_2/circle_m",
  "root_bg/group_bkg_2/circle_outline_return",
  "root_bg/group_bkg_2/circle_s",
  "root_bg/circle_m_c2/mask",
  "root_bg/circle_m_c2/circle",
  "root_bg/circle_s_c2/mask",
  "root_bg/circle_s_c2/circle",
  "panel_entry_anim/entry_mask_c5",
  "panel_entry_anim/entry_mask_c6",
  "panel_entry_anim/entry_mask_c7",
  "panel_circle_part/root/mask_c7",
  "panel_circle_part/root/mask_c7_copy",
  "panel_circle_part/root/mask_c6",
  "panel_circle_part/root/circle_1",
  "panel_circle_part/root/circle_1_c8_copy",
  "panel_circle_part/root/circle_2",
  "panel_circle_part/root/circle_2_c8_copy",
  "panel_circle_part/root/circle_3",
  "panel_circle_part/root/circle_4",
  "panel_circle_part/root/moon_c7",
  "panel_circle_part/root/moon_c6",
]);

const HIDDEN_STENCIL_WRITERS = new Set([
  "root_bg/group_bkg_1/circle_blue_c1/circle_blue_c3",
  "root_bg/group_bkg_1/group_bg/moon_mask_c2",
  "root_bg/group_bkg_1/group_bg/circle_tiny/circle_mask",
  "root_bg/circle_m_c2/mask",
  "root_bg/circle_s_c2/mask",
  "panel_entry_anim/entry_mask_c5",
  "panel_circle_part/root/mask_c8",
  "panel_circle_part/root/mask_c7",
  "panel_circle_part/root/mask_c7_copy",
  "panel_circle_part/root/mask_c6",
]);

const STENCIL_RULES = [
  ["root_bg/char_mask_c1", "root_bg/group_bkg_1/white_c1", "inside"],
  ["root_bg/char_mask_c1", "root_bg/group_bkg_1/circle_blue_c1", "inside"],
  ["root_bg/char_mask_c1", "root_bg/bg_cover", "outside"],
  ["root_bg/char_mask_c1", "root_bg/root_char_main/makoto_c1_color", "inside"],
  ["root_bg/char_mask_c1", "root_bg/root_char_main/makoto_c1", "inside"],
  ["root_bg/char_mask_c1", "root_bg/root_char_main/makoto_copy", "outside"],
  ["root_bg/group_bkg_1/group_bg/moon_mask_c2", "root_bg/group_bkg_1/group_bg/char_left_s_c2", "inside"],
  ["root_bg/group_bkg_1/circle_blue_c1/circle_blue_c3", "root_bg/group_bkg_1/group_bg/circle_s/circle_1_c3", "inside"],
  ["root_bg/group_bkg_1/circle_blue_c1/circle_blue_c3", "root_bg/group_bkg_1/group_bg/circle_s/circle_2_c3", "outside"],
  ["root_bg/group_bkg_1/group_bg/circle_tiny/circle_mask", "root_bg/group_bkg_1/group_bg/circle_tiny/circle_copy", "outside"],
  ["root_bg/circle_m_c2/mask", "root_bg/circle_m_c2/circle", "inside"],
  ["root_bg/circle_s_c2/mask", "root_bg/circle_s_c2/circle", "inside"],
  ["panel_entry_anim/entry_mask_c5", "panel_entry_anim/entry_bg_2_c5", "inside"],
  ["panel_entry_anim/entry_mask_c5", "panel_entry_anim/scale_1/text_1_c5", "inside"],
  ["panel_entry_anim/entry_mask_c5", "panel_entry_anim/scale_1/text_2_c5", "inside"],
  ["panel_entry_anim/entry_mask_c5", "panel_entry_anim/scale_1/scale_2/root_1/char_makoto_c5", "inside"],
  ["panel_entry_anim/entry_mask_c5", "panel_entry_anim/entry_main_text_3_c5", "inside"],
  ["panel_entry_anim/entry_mask_c6", "panel_entry_anim/entry_main_text_2_c6", "outside"],
  ["panel_entry_anim/entry_mask_c7", "panel_entry_anim/scale_1_copy/text_1_c7", "inside"],
  ["panel_entry_anim/entry_mask_c7", "panel_entry_anim/scale_1_copy/text_2_c7", "inside"],
  ["panel_entry_anim/entry_mask_c7", "panel_entry_anim/scale_1_copy/scale_2_copy/root_1/char_makoto_c7", "inside"],
  ["panel_entry_anim/entry_bg_5_c8", "panel_entry_anim/scale_4/text_1", "outside"],
  ["panel_entry_anim/entry_bg_5_c8", "panel_entry_anim/scale_4/text_2", "outside"],
  ["panel_entry_anim/entry_bg_5_c8", "panel_entry_anim/scale_4/text_1_copy", "inside"],
  ["panel_entry_anim/entry_bg_5_c8", "panel_entry_anim/scale_4/text_2_copy", "inside"],
  ["panel_entry_anim/entry_bg_5_c8", "panel_entry_anim/names", "outside"],
  ["panel_entry_anim/entry_bg_5_c8", "panel_entry_anim/entry_main_text_4_c8", "outside"],
  ["panel_entry_anim/entry_bg_5_c8", "panel_entry_anim/entry_main_text_5_c8", "inside"],
  ["panel_entry_anim/entry_bg_6_c1", "panel_entry_anim/entry_main_text_c1", "inside"],
  ["panel_entry_anim/entry_bg_7_c2", "panel_entry_anim/entry_main_text_c2", "inside"],
  ["panel_circle_part/root/mask_c8", "panel_circle_part/root/circle_1_c8_copy", "outside"],
  ["panel_circle_part/root/mask_c8", "panel_circle_part/root/circle_2_c8_copy", "outside"],
  [["panel_circle_part/root/mask_c7", "panel_circle_part/root/mask_c7_copy"], "panel_circle_part/root/moon_c7", "outside"],
  ["panel_circle_part/root/mask_c6", "panel_circle_part/root/moon_c6", "inside"],
];

for (let index = 1; index <= 6; index += 1) {
  const waterFrame = String(index).padStart(2, "0");
  STENCIL_RULES.push(
    ["root_bg/char_mask_c1", `root_bg/bg_cover/water_anim_1/${waterFrame}`, "outside"],
  );
}

for (const path of [
  "root_bg/bg_cover/light_1",
  "root_bg/bg_cover/light_2",
  "root_bg/bg_cover/scale/desc",
  "root_bg/bg_cover/right_copy/root_char_right/char_2",
]) {
  STENCIL_RULES.push(["root_bg/char_mask_c1", path, "outside"]);
}

for (let index = 1; index <= 5; index += 1) {
  STENCIL_RULES.push(
    ["panel_entry_anim/entry_mask_c6", `panel_entry_anim/group_water/part_1/water_${index}`, "inside"],
  );
}

for (let index = 1; index <= 5; index += 1) {
  STENCIL_RULES.push(
    ["panel_entry_anim/entry_bg_5_c8", `panel_entry_anim/scale_3/char_${index}`, "outside"],
    ["panel_entry_anim/entry_bg_5_c8", `panel_entry_anim/scale_3/char_${index}/char_${index}_copy`, "inside"],
  );
}

function cloneArray(value) {
  return value ? [...value] : value;
}

function rgba(color, alpha = 1) {
  return `rgba(${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)}, ${color[3] * alpha})`;
}

function createGraphic(node, element) {
  if (!node.graphic) return null;

  const layer = document.createElement("div");
  layer.className = "unity-graphic";
  const sprite = node.graphic.sprite;
  let image = null;
  let tint = null;

  if (sprite) {
    /* 清单里的贴图在收场前从不显示：不创建 img，不发起加载，
       返回 null 让 updateVisual/updateFill 直接跳过该图层 */
    if (SKIP_SPRITE_FILES.has(sprite.url.split("/").pop())) return null;
    image = document.createElement("img");
    image.className = "unity-sprite";
    image.alt = "";
    image.draggable = false;
    image.src = assetUrl(sprite.url);
    const [textureWidth, textureHeight] = sprite.textureSize;
    const [x, y, width, height] = sprite.rect;
    image.style.width = `${(textureWidth / width) * 100}%`;
    image.style.height = `${(textureHeight / height) * 100}%`;
    image.style.left = `${(-x / width) * 100}%`;
    image.style.top = `${(-(textureHeight - y - height) / height) * 100}%`;
    tint = document.createElement("span");
    tint.className = "unity-tint";
    tint.style.width = image.style.width;
    tint.style.height = image.style.height;
    tint.style.left = image.style.left;
    tint.style.top = image.style.top;
    tint.style.maskImage = `url("${image.src}")`;
    tint.style.maskSize = "100% 100%";
    tint.style.maskRepeat = "no-repeat";
    imagePromises.push(
      image.decode().catch(() => {
        if (!CDN_BASE) {
          console.warn(`Unable to decode ${sprite.url}`);
          return;
        }
        /* CDN 加载失败 → 换回本站同源地址再试一次 */
        return new Promise((resolve) => {
          image.onload = () => resolve();
          image.onerror = () => {
            console.warn(`Unable to decode ${sprite.url}`);
            resolve();
          };
          image.src = encodeURI(sprite.url);
          tint.style.maskImage = `url("${image.src}")`;
        });
      }),
    );
    layer.append(image);
    layer.append(tint);
    if (sprite.name === "sprite_white") {
      image.hidden = true;
      tint.hidden = true;
      layer.classList.add("is-solid-sprite");
    }
  }

  element.append(layer);
  return { layer, image, tint };
}

function createNode(node, parentElement) {
  const id = ++nextNodeId;
  const element = document.createElement("div");
  element.className = "unity-node";
  element.dataset.path = node.path;
  element.dataset.name = node.name;

  // 活动主界面（菜单、按钮、顶栏）按配置整段不渲染
  const suppressed = INTRO_CONFIG.hideFrontUi
    && FRONT_UI_PREFIXES.some((prefix) => node.path === prefix || node.path.startsWith(`${prefix}/`));
  if (suppressed) element.classList.add("is-suppressed");

  if (node.graphic && /circle|round_wire|moon/i.test(node.name)) element.classList.add("is-round");
  if (CIRCLE_MATERIAL_PATHS.has(node.path)) element.classList.add("is-material-circle");
  if (node.name === "mask" && /circle/i.test(node.path)) element.classList.add("is-round");
  if (/outline|round_wire|\bline\b/i.test(node.name)) element.classList.add("is-outline");
  if (/^title_main_glass/.test(node.name)) {
    element.classList.add("is-title-glass");
    element.style.maskImage = `url("${encodeURI("assets/images/title_main_mask.png")}")`;
    element.style.maskSize = "100% 100%";
    element.style.maskRepeat = "no-repeat";
  }
  if (node.mask) {
    element.classList.add("is-mask");
    if (node.mask.kind === "graphic") element.classList.add("is-graphic-mask");
  }

  const visual = createGraphic(node, element);
  let textElement = null;
  if (node.text?.value) {
    textElement = document.createElement("span");
    textElement.className = "unity-text";
    textElement.textContent = node.text.value;
    textElement.style.fontSize = `${node.text.fontSize}px`;
    textElement.style.color = rgba(node.text.color);
    element.append(textElement);
  }

  parentElement.append(element);

  const runtime = {
    source: node,
    element,
    visual,
    textElement,
    position: cloneArray(node.transform.position),
    size: cloneArray(node.transform.size),
    scale: cloneArray(node.transform.scale),
    rotation: cloneArray(node.transform.rotation),
    active: node.active,
    alpha: node.group?.alpha ?? 1,
    color: cloneArray(node.graphic?.color ?? [1, 1, 1, 1]),
    fillAmount: node.graphic?.fillAmount ?? 1,
    fillOrigin: node.graphic?.fillOrigin ?? 0,
    rect: null,
    children: [],
    suppressed,
  };
  nodes.set(node.path, runtime);

  for (const child of node.children) {
    runtime.children.push(createNode(child, element));
  }

  if (node.mask?.kind === "graphic" && node.graphic?.sprite) {
    element.style.maskImage = `url("${assetUrl(node.graphic.sprite.url)}")`;
    element.style.maskSize = "100% 100%";
    element.style.maskRepeat = "no-repeat";
  }

  if (node.mask && !node.mask.showGraphic && visual) visual.layer.hidden = true;
  return runtime;
}

function resetRuntime(runtime) {
  const node = runtime.source;
  runtime.position[0] = node.transform.position[0];
  runtime.position[1] = node.transform.position[1];
  runtime.size[0] = node.transform.size[0];
  runtime.size[1] = node.transform.size[1];
  runtime.scale[0] = node.transform.scale[0];
  runtime.scale[1] = node.transform.scale[1];
  runtime.scale[2] = node.transform.scale[2];
  runtime.rotation = cloneArray(node.transform.rotation);
  runtime.active = node.active;
  runtime.alpha = node.group?.alpha ?? 1;
  runtime.color = cloneArray(node.graphic?.color ?? [1, 1, 1, 1]);
  runtime.fillAmount = node.graphic?.fillAmount ?? 1;
  runtime.fillOrigin = node.graphic?.fillOrigin ?? 0;
}

function applyFloatCurve(runtime, property, value) {
  switch (property) {
    case "m_AnchoredPosition.x":
      runtime.position[0] = value;
      break;
    case "m_AnchoredPosition.y":
      runtime.position[1] = value;
      break;
    case "m_SizeDelta.x":
      runtime.size[0] = value;
      break;
    case "m_SizeDelta.y":
      runtime.size[1] = value;
      break;
    case "m_Alpha":
      runtime.alpha = value;
      break;
    case "m_Color.r":
      runtime.color[0] = value;
      break;
    case "m_Color.g":
      runtime.color[1] = value;
      break;
    case "m_Color.b":
      runtime.color[2] = value;
      break;
    case "m_Color.a":
      runtime.color[3] = value;
      break;
    case "m_FillAmount":
      runtime.fillAmount = value;
      break;
    case "m_FillOrigin":
      runtime.fillOrigin = value;
      break;
    case "m_IsActive":
      runtime.active = value >= 0.5;
      break;
    case "_floatProperty1.floatValue":
      runtime.element.style.setProperty("--shader-value-1", value);
      break;
    case "_floatProperty2.floatValue":
      runtime.element.style.setProperty("--shader-value-2", value);
      break;
  }
}

function updateFill(runtime) {
  const graphic = runtime.source.graphic;
  const layer = runtime.visual?.layer;
  if (!graphic || !layer) return;
  const amount = Math.max(0, Math.min(1, runtime.fillAmount));

  layer.style.clipPath = "";
  layer.style.maskImage = "";
  if (amount >= 0.9999) return;

  if (graphic.fillMethod === 0) {
    const hidden = (1 - amount) * 100;
    layer.style.clipPath = runtime.fillOrigin === 1
      ? `inset(0 0 0 ${hidden}%)`
      : `inset(0 ${hidden}% 0 0)`;
  } else if (graphic.fillMethod === 1) {
    const hidden = (1 - amount) * 100;
    layer.style.clipPath = runtime.fillOrigin === 1
      ? `inset(0 0 ${hidden}% 0)`
      : `inset(${hidden}% 0 0 0)`;
  } else {
    const sweep = amount * 360;
    const origin = [180, 90, 0, 270][runtime.fillOrigin % 4];
    const start = graphic.fillClockwise ? origin : origin - sweep;
    layer.style.maskImage = `conic-gradient(from ${start}deg, #000 0deg ${amount * 360}deg, transparent ${amount * 360}deg 360deg)`;
  }
}

function updateVisual(runtime) {
  const { source, element, visual, color } = runtime;
  if (runtime.suppressed) {
    element.style.display = "none";
    return;
  }
  element.style.display = runtime.active ? "block" : "none";
  element.style.opacity = String(Math.max(0, runtime.alpha));
  if (!visual) return;

  const enabled = source.graphic.enabled && color[3] > 0.0001;
  visual.layer.style.display = enabled ? "block" : "none";
  visual.layer.style.opacity = String(Math.max(0, color[3]));

  // These RGB channels encode dissolve thresholds, not a vertex tint.
  if (source.path === "root_bg/root_char_main/makoto_c1") {
    visual.layer.style.opacity = String(Math.max(0, color[3] * (1 - color[2])));
  }
  if (["group_title/flash", "group_title/flash_copy", "group_title/title_main_copy"].includes(source.path)) {
    visual.layer.style.opacity = String(Math.max(0, color[3] * (1 - color[1])));
  }

  if (visual.image && !visual.image.hidden) {
    const shaderControlled =
      source.path === "root_bg/root_char_main/makoto_c1" ||
      (source.path.startsWith("group_title/") && source.path !== "group_title/title_main");
    const flatTinted =
      source.path.startsWith("panel_entry_anim/") ||
      source.path.startsWith("panel_circle_part/") ||
      source.path.startsWith("root_bg/root_char_main/") ||
      source.path === "group_title/title_main";
    visual.tint.hidden = shaderControlled;
    visual.image.style.visibility = flatTinted && !shaderControlled ? "hidden" : "visible";
    if (!shaderControlled) {
      const tintColor = source.path === "root_bg/root_char_main/makoto_c1_color"
        ? [0.03, 0.25 + color[1] * 0.45, 0.85 + color[1] * 0.15]
        : source.path === "group_title/title_main"
          ? [0, 0.95, 0.91]
          : color.slice(0, 3);
      const channels = tintColor.map((value) => Math.round(value * 255)).join(" ");
      visual.tint.style.backgroundColor = `rgb(${channels})`;
      visual.tint.style.mixBlendMode = flatTinted ? "normal" : "multiply";
    }
  } else {
    if (element.classList.contains("is-title-glass")) {
      visual.layer.style.opacity = String(Math.max(0, color[3] * 0.04));
      visual.layer.style.background = "linear-gradient(105deg, transparent 24%, white 48%, transparent 70%)";
    } else {
      visual.layer.style.background = rgba([color[0], color[1], color[2], 1]);
    }
    if (element.classList.contains("is-outline")) {
      visual.layer.style.background = "transparent";
      visual.layer.style.border = `${Math.max(1, Number(element.style.getPropertyValue("--shader-value-1")) || 2)}px solid ${rgba(color)}`;
    }
  }

  updateFill(runtime);
}

function setStencilMask(target, mask) {
  // Unity's stencil comparison belongs to the current Graphic renderer. Applying
  // it to the RectTransform would also clip child renderers, including the
  // inverse-stencil copies nested under several entry character/text nodes.
  const surface = target.visual?.layer ?? target.element;
  surface.style.maskImage = mask;
  surface.style.webkitMaskImage = mask;
  surface.style.maskRepeat = "no-repeat";
  surface.style.webkitMaskRepeat = "no-repeat";
}

function multiplyMatrix(left, right) {
  return [
    left[0] * right[0] + left[2] * right[1],
    left[1] * right[0] + left[3] * right[1],
    left[0] * right[2] + left[2] * right[3],
    left[1] * right[2] + left[3] * right[3],
    left[0] * right[4] + left[2] * right[5] + left[4],
    left[1] * right[4] + left[3] * right[5] + left[5],
  ];
}

function invertMatrix(matrix) {
  const [a, b, c, d, e, f] = matrix;
  const determinant = a * d - b * c;
  if (Math.abs(determinant) < 1e-8) return null;
  return [
    d / determinant,
    -b / determinant,
    -c / determinant,
    a / determinant,
    (c * f - d * e) / determinant,
    (b * e - a * f) / determinant,
  ];
}

function transformPoint(matrix, x, y) {
  return [
    matrix[0] * x + matrix[2] * y + matrix[4],
    matrix[1] * x + matrix[3] * y + matrix[5],
  ];
}

function stencilPolygon(writer, target) {
  const inverseTarget = invertMatrix(target.worldMatrix);
  if (!inverseTarget) return [];
  const graphic = writer.source.graphic;
  const width = writer.rect.width;
  const height = writer.rect.height;
  let left = 0;
  let right = width;

  let localPoints;
  if (graphic?.type === 3 && graphic.fillMethod === 4 && writer.fillAmount < 0.9999) {
    // Radial360 is a sector of a rectangular UI mesh, not an ellipse. Keep the
    // missing wedge when this mesh writes stencil (the turntable highlight).
    const amount = Math.max(0, Math.min(1, writer.fillAmount));
    const start = [180, 90, 0, 270][writer.fillOrigin % 4];
    const direction = graphic.fillClockwise ? 1 : -1;
    const steps = Math.max(1, Math.ceil(amount * 360 / 4));
    localPoints = [[width / 2, height / 2]];
    for (let index = 0; index <= steps; index += 1) {
      const radians = (start + direction * amount * 360 * index / steps) * Math.PI / 180;
      const dx = Math.sin(radians);
      const dy = -Math.cos(radians);
      const distance = Math.min(
        Math.abs(dx) < 1e-8 ? Infinity : width / 2 / Math.abs(dx),
        Math.abs(dy) < 1e-8 ? Infinity : height / 2 / Math.abs(dy),
      );
      localPoints.push([width / 2 + dx * distance, height / 2 + dy * distance]);
    }
  } else if (graphic?.type === 3 && graphic.fillMethod === 0) {
    const amount = Math.max(0, Math.min(1, writer.fillAmount));
    if (writer.fillOrigin === 1) left = width * (1 - amount);
    else right = width * amount;
  }

  return (localPoints ?? [
    [left, 0],
    [right, 0],
    [right, height],
    [left, height],
  ]).map(([x, y]) => {
    const world = transformPoint(writer.worldMatrix, x, y);
    return transformPoint(inverseTarget, world[0], world[1]);
  });
}

function polygonMask(target, points, mode) {
  if (points.length < 3) return mode === "inside" ? "linear-gradient(transparent, transparent)" : "none";
  const width = Math.max(1, target.rect.width);
  const height = Math.max(1, target.rect.height);
  const polygon = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join("") + "Z";
  const path = mode === "inside"
    ? polygon
    : `M0 0H${width.toFixed(2)}V${height.toFixed(2)}H0Z${polygon}`;
  const fillRule = mode === "outside" ? ' fill-rule="evenodd"' : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><path${fillRule} fill="white" d="${path}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function stencilEllipse(writer, target) {
  const inverseTarget = invertMatrix(target.worldMatrix);
  if (!inverseTarget) return null;
  const centerWorld = transformPoint(writer.worldMatrix, writer.rect.width / 2, writer.rect.height / 2);
  const xWorld = transformPoint(writer.worldMatrix, writer.rect.width, writer.rect.height / 2);
  const yWorld = transformPoint(writer.worldMatrix, writer.rect.width / 2, writer.rect.height);
  const center = transformPoint(inverseTarget, centerWorld[0], centerWorld[1]);
  const xEdge = transformPoint(inverseTarget, xWorld[0], xWorld[1]);
  const yEdge = transformPoint(inverseTarget, yWorld[0], yWorld[1]);
  return {
    centerX: center[0],
    centerY: center[1],
    radiusX: Math.hypot(xEdge[0] - center[0], xEdge[1] - center[1]) * 0.98,
    radiusY: Math.hypot(yEdge[0] - center[0], yEdge[1] - center[1]) * 0.98,
  };
}

function applyStencilUnion(writerPaths, targetPath, mode) {
  const target = nodes.get(targetPath);
  if (!target) return;
  const ellipses = writerPaths
    .map((path) => nodes.get(path))
    .filter((writer) => writer?.active && writer.rect.width > 0.01)
    .map((writer) => stencilEllipse(writer, target))
    .filter(Boolean);
  if (ellipses.length === 0) {
    setStencilMask(target, mode === "inside" ? "linear-gradient(transparent, transparent)" : "none");
    return;
  }
  const width = Math.max(1, target.rect.width);
  const height = Math.max(1, target.rect.height);
  const background = mode === "outside" ? "white" : "black";
  const foreground = mode === "outside" ? "black" : "white";
  const shapes = ellipses.map(({ centerX, centerY, radiusX, radiusY }) =>
    `<ellipse fill="${foreground}" cx="${centerX}" cy="${centerY}" rx="${radiusX}" ry="${radiusY}"/>`,
  ).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><defs><mask id="stencil" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${background}"/>${shapes}</mask></defs><rect width="100%" height="100%" fill="white" mask="url(#stencil)"/></svg>`;
  setStencilMask(target, `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
}

function applyStencil(writerPath, targetPath, mode) {
  const writer = nodes.get(writerPath);
  const target = nodes.get(targetPath);
  if (!writer || !target) return;

  if (!writer.active || writer.rect.width < 0.01 || target.rect.width < 0.01) {
    setStencilMask(target, mode === "inside" ? "linear-gradient(transparent, transparent)" : "none");
    return;
  }

  const writerGraphic = writer.source.graphic;
  if (writerGraphic?.type === 3 && writerGraphic.fillAmount !== undefined && writer.fillAmount < 0.0001) {
    setStencilMask(target, mode === "inside" ? "linear-gradient(transparent, transparent)" : "none");
    return;
  }

  if (!CIRCLE_MATERIAL_PATHS.has(writerPath)) {
    setStencilMask(target, polygonMask(target, stencilPolygon(writer, target), mode));
    return;
  }

  const ellipse = stencilEllipse(writer, target);
  if (!ellipse) return;
  const { centerX, centerY, radiusX, radiusY } = ellipse;
  const edge = 1.5;
  const mask = mode === "inside"
    ? `radial-gradient(ellipse ${radiusX}px ${radiusY}px at ${centerX}px ${centerY}px, #000 0, #000 calc(100% - ${edge}px), transparent 100%)`
    : `radial-gradient(ellipse ${radiusX}px ${radiusY}px at ${centerX}px ${centerY}px, transparent 0, transparent calc(100% - ${edge}px), #000 100%)`;
  setStencilMask(target, mask);
}

function applyStencils() {
  for (const path of HIDDEN_STENCIL_WRITERS) {
    const writer = nodes.get(path);
    if (writer?.visual) writer.visual.layer.style.visibility = "hidden";
  }
  for (const [writer, target, mode] of STENCIL_RULES) {
    if (Array.isArray(writer)) applyStencilUnion(writer, target, mode);
    else applyStencil(writer, target, mode);
  }
}

function layoutNode(runtime, parentRect, parentWorldMatrix = [1, 0, 0, 1, 0, 0]) {
  const { transform } = runtime.source;
  const isRoot = runtime.source.path === "";
  if (runtime.suppressed) {
    // 不参与布局，尺寸记为 0，避免被当作模板遮罩写入者使用
    runtime.rect = { width: 0, height: 0 };
    runtime.worldMatrix = parentWorldMatrix;
    runtime.element.style.display = "none";
    return;
  }
  const width =
    (transform.anchorMax[0] - transform.anchorMin[0]) * parentRect.width + runtime.size[0];
  const height =
    (transform.anchorMax[1] - transform.anchorMin[1]) * parentRect.height + runtime.size[1];
  const pivotX =
    (transform.anchorMin[0] +
      (transform.anchorMax[0] - transform.anchorMin[0]) * transform.pivot[0]) *
      parentRect.width +
    runtime.position[0];
  const pivotY =
    (transform.anchorMin[1] +
      (transform.anchorMax[1] - transform.anchorMin[1]) * transform.pivot[1]) *
      parentRect.height +
    runtime.position[1];
  const left = pivotX - transform.pivot[0] * width;
  const bottom = pivotY - transform.pivot[1] * height;
  const top = parentRect.height - bottom - height;
  const angle = -quaternionZDegrees(runtime.rotation);
  const radians = angle * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const originX = isRoot ? 0 : transform.pivot[0] * width;
  const originY = isRoot ? 0 : (1 - transform.pivot[1]) * height;
  const scaleX = runtime.scale[0] * (isRoot ? OUTPUT_SCALE : 1);
  const scaleY = runtime.scale[1] * (isRoot ? OUTPUT_SCALE : 1);
  const a = cosine * scaleX;
  const b = sine * scaleX;
  const c = -sine * scaleY;
  const d = cosine * scaleY;
  const localMatrix = [
    a,
    b,
    c,
    d,
    left + originX - a * originX - c * originY,
    top + originY - b * originX - d * originY,
  ];

  runtime.rect = { width, height };
  runtime.worldMatrix = multiplyMatrix(parentWorldMatrix, localMatrix);
  runtime.element.style.left = `${left}px`;
  runtime.element.style.top = `${top}px`;
  runtime.element.style.width = `${width}px`;
  runtime.element.style.height = `${height}px`;
  runtime.element.style.transformOrigin = isRoot
    ? "0 0"
    : `${transform.pivot[0] * 100}% ${(1 - transform.pivot[1]) * 100}%`;
  runtime.element.style.transform = `rotate(${angle}deg) scale(${scaleX}, ${scaleY})`;
  updateVisual(runtime);

  for (const child of runtime.children) layoutNode(child, runtime.rect, runtime.worldMatrix);
}

function render(time) {
  currentTime = Math.max(0, Math.min(sceneData.duration, time));
  nodes.forEach(resetRuntime);

  for (const curve of sceneData.curves) {
    const runtime = nodes.get(curve.path);
    if (!runtime) continue;
    if (curve.kind === "float") {
      applyFloatCurve(runtime, curve.property, evaluateScalar(curve.keys, currentTime));
    } else if (curve.kind === "scale") {
      runtime.scale = evaluateVector(curve.keys, currentTime);
    } else if (curve.kind === "rotation") {
      runtime.rotation = evaluateVector(curve.keys, currentTime);
    }
  }

  layoutNode(nodes.get(""), { width: REFERENCE_VIEWPORT[0], height: REFERENCE_VIEWPORT[1] });
  applyStencils();
  const frame = Math.round(currentTime * sceneData.frameRate);
  stage.dataset.frame = String(frame);
  stage.dataset.time = currentTime.toFixed(6);
}

function tick(now) {
  if (!playing) return;
  let time = (now - startedAt) / 1000;

  // 到达配置的时间点：定格在该帧，然后收场（通知主页 / 跳转）
  if (END_ACTION !== "none" && time >= REDIRECT_AT_SECONDS) {
    render(REDIRECT_AT_SECONDS);
    finishIntro();
    return;
  }

  if (time >= sceneData.duration) {
    if (loop) {
      startedAt = now;
      time = 0;
    } else {
      time = sceneData.duration;
      playing = false;
    }
  }
  render(time);
  if (playing) animationFrame = requestAnimationFrame(tick);
}

function play() {
  if (currentTime >= sceneData.duration) currentTime = 0;
  playing = true;
  startedAt = performance.now() - currentTime * 1000;
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(tick);
}

function pause() {
  playing = false;
  cancelAnimationFrame(animationFrame);
}

function seek(time) {
  pause();
  render(time);
}

function fitStage() {
  const viewport = window.visualViewport;
  const width = viewport?.width ?? innerWidth;
  const height = viewport?.height ?? innerHeight;
  const offsetLeft = viewport?.offsetLeft ?? 0;
  const offsetTop = viewport?.offsetTop ?? 0;
  const portrait = height > width;
  const [sceneWidth, sceneHeight] = sceneData.viewport;
  const scale = portrait
    ? Math.min(width / sceneHeight, height / sceneWidth)
    : Math.min(width / sceneWidth, height / sceneHeight);

  document.documentElement.style.setProperty("--viewport-width", `${width}px`);
  document.documentElement.style.setProperty("--viewport-center-x", `${offsetLeft + width / 2}px`);
  document.documentElement.style.setProperty("--viewport-bottom", `${offsetTop + height}px`);
  scaler.style.setProperty("--stage-scale", scale);
  scaler.style.setProperty("--stage-rotation", portrait ? "90deg" : "0deg");
  scaler.style.left = `${offsetLeft + width / 2}px`;
  scaler.style.top = `${offsetTop + height / 2}px`;
  scaler.dataset.orientation = portrait ? "portrait" : "landscape";
}

createNode(sceneData.root, stage);

addEventListener("resize", fitStage);
addEventListener("orientationchange", fitStage);
window.visualViewport?.addEventListener("resize", fitStage);
window.visualViewport?.addEventListener("scroll", fitStage);

fitStage();
render(0);

window.act54Animation = {
  play,
  pause,
  seek,
  getState() {
    return {
      clip: sceneData.clip,
      time: currentTime,
      frame: Math.round(currentTime * sceneData.frameRate),
      playing,
      loop,
    };
  },
};

Promise.all(imagePromises).finally(() => {
  loading.classList.add("is-ready");
  setTimeout(() => loading.remove(), 450);
  // ?t=秒：定格在指定时刻，方便逐帧核对（不自动播放）
  if (frameQuery !== null && frameQuery !== "") {
    seek(Number(frameQuery) || 0);
    return;
  }
  if (DEBUG) {
    console.log("[intro] mode:", EMBEDDED ? "embed(被主页嵌入)" : "standalone(独立页面)",
      "| end action:", END_ACTION, "| at", REDIRECT_AT_SECONDS, "s ->", REDIRECT_URL || "(不跳转)");
  }
  // 资源已就绪，通知主页可以放心继续（主页用它来取消"加载超时"兜底）
  postToHost("ready");
  if (query.get("autoplay") !== "0") play();
});
