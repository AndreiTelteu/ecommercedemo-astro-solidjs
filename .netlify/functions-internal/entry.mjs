import * as adapter from '@astrojs/netlify/netlify-functions.js';
import { ssr, renderToString as renderToString$1, createComponent as createComponent$1 } from 'solid-js/web';
import { escape } from 'html-escaper';
/* empty css                            *//* empty css                        */import crypto from 'node:crypto';
import objectHash from 'object-hash';
import fs from 'node:fs';
import path, { extname, basename, join, relative, resolve } from 'node:path';
import util from 'node:util';
import potrace from 'potrace';
import { findUp } from 'find-up';
import findCacheDir from 'find-cache-dir';
import { fileURLToPath } from 'node:url';
import 'mime';
import 'kleur/colors';
import 'string-width';
import 'path-browserify';
import { compile } from 'path-to-regexp';

const slotName$1 = (str) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());

function check$1(Component, props, children) {
	if (typeof Component !== 'function') return false;
	const { html } = renderToStaticMarkup$1(Component, props, children);
	return typeof html === 'string';
}

function renderToStaticMarkup$1(Component, props, { default: children, ...slotted }) {
	const slots = {};
	for (const [key, value] of Object.entries(slotted)) {
		const name = slotName$1(key);
		slots[name] = ssr(`<astro-slot name="${name}">${value}</astro-slot>`);
	}
	// Note: create newProps to avoid mutating `props` before they are serialized
	const newProps = {
		...props,
		...slots,
		// In Solid SSR mode, `ssr` creates the expected structure for `children`.
		children: children != null ? ssr(`<astro-slot>${children}</astro-slot>`) : children,
	};
	const html = renderToString$1(() => createComponent$1(Component, newProps));
	return { html };
}

const _renderer1 = {
	check: check$1,
	renderToStaticMarkup: renderToStaticMarkup$1,
};

const ASTRO_VERSION = "1.0.7";
function createDeprecatedFetchContentFn() {
  return () => {
    throw new Error("Deprecated: Astro.fetchContent() has been replaced with Astro.glob().");
  };
}
function createAstroGlobFn() {
  const globHandler = (importMetaGlobResult, globValue) => {
    let allEntries = [...Object.values(importMetaGlobResult)];
    if (allEntries.length === 0) {
      throw new Error(`Astro.glob(${JSON.stringify(globValue())}) - no matches found.`);
    }
    return Promise.all(allEntries.map((fn) => fn()));
  };
  return globHandler;
}
function createAstro(filePathname, _site, projectRootStr) {
  const site = _site ? new URL(_site) : void 0;
  const referenceURL = new URL(filePathname, `http://localhost`);
  const projectRoot = new URL(projectRootStr);
  return {
    site,
    generator: `Astro v${ASTRO_VERSION}`,
    fetchContent: createDeprecatedFetchContentFn(),
    glob: createAstroGlobFn(),
    resolve(...segments) {
      let resolved = segments.reduce((u, segment) => new URL(segment, u), referenceURL).pathname;
      if (resolved.startsWith(projectRoot.pathname)) {
        resolved = "/" + resolved.slice(projectRoot.pathname.length);
      }
      return resolved;
    }
  };
}

const escapeHTML = escape;
class HTMLString extends String {
}
const markHTMLString = (value) => {
  if (value instanceof HTMLString) {
    return value;
  }
  if (typeof value === "string") {
    return new HTMLString(value);
  }
  return value;
};

class Metadata {
  constructor(filePathname, opts) {
    this.modules = opts.modules;
    this.hoisted = opts.hoisted;
    this.hydratedComponents = opts.hydratedComponents;
    this.clientOnlyComponents = opts.clientOnlyComponents;
    this.hydrationDirectives = opts.hydrationDirectives;
    this.mockURL = new URL(filePathname, "http://example.com");
    this.metadataCache = /* @__PURE__ */ new Map();
  }
  resolvePath(specifier) {
    if (specifier.startsWith(".")) {
      const resolved = new URL(specifier, this.mockURL).pathname;
      if (resolved.startsWith("/@fs") && resolved.endsWith(".jsx")) {
        return resolved.slice(0, resolved.length - 4);
      }
      return resolved;
    }
    return specifier;
  }
  getPath(Component) {
    const metadata = this.getComponentMetadata(Component);
    return (metadata == null ? void 0 : metadata.componentUrl) || null;
  }
  getExport(Component) {
    const metadata = this.getComponentMetadata(Component);
    return (metadata == null ? void 0 : metadata.componentExport) || null;
  }
  getComponentMetadata(Component) {
    if (this.metadataCache.has(Component)) {
      return this.metadataCache.get(Component);
    }
    const metadata = this.findComponentMetadata(Component);
    this.metadataCache.set(Component, metadata);
    return metadata;
  }
  findComponentMetadata(Component) {
    const isCustomElement = typeof Component === "string";
    for (const { module, specifier } of this.modules) {
      const id = this.resolvePath(specifier);
      for (const [key, value] of Object.entries(module)) {
        if (isCustomElement) {
          if (key === "tagName" && Component === value) {
            return {
              componentExport: key,
              componentUrl: id
            };
          }
        } else if (Component === value) {
          return {
            componentExport: key,
            componentUrl: id
          };
        }
      }
    }
    return null;
  }
}
function createMetadata(filePathname, options) {
  return new Metadata(filePathname, options);
}

const PROP_TYPE = {
  Value: 0,
  JSON: 1,
  RegExp: 2,
  Date: 3,
  Map: 4,
  Set: 5,
  BigInt: 6,
  URL: 7
};
function serializeArray(value) {
  return value.map((v) => convertToSerializedForm(v));
}
function serializeObject(value) {
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => {
      return [k, convertToSerializedForm(v)];
    })
  );
}
function convertToSerializedForm(value) {
  const tag = Object.prototype.toString.call(value);
  switch (tag) {
    case "[object Date]": {
      return [PROP_TYPE.Date, value.toISOString()];
    }
    case "[object RegExp]": {
      return [PROP_TYPE.RegExp, value.source];
    }
    case "[object Map]": {
      return [PROP_TYPE.Map, JSON.stringify(serializeArray(Array.from(value)))];
    }
    case "[object Set]": {
      return [PROP_TYPE.Set, JSON.stringify(serializeArray(Array.from(value)))];
    }
    case "[object BigInt]": {
      return [PROP_TYPE.BigInt, value.toString()];
    }
    case "[object URL]": {
      return [PROP_TYPE.URL, value.toString()];
    }
    case "[object Array]": {
      return [PROP_TYPE.JSON, JSON.stringify(serializeArray(value))];
    }
    default: {
      if (value !== null && typeof value === "object") {
        return [PROP_TYPE.Value, serializeObject(value)];
      } else {
        return [PROP_TYPE.Value, value];
      }
    }
  }
}
function serializeProps(props) {
  return JSON.stringify(serializeObject(props));
}

function serializeListValue(value) {
  const hash = {};
  push(value);
  return Object.keys(hash).join(" ");
  function push(item) {
    if (item && typeof item.forEach === "function")
      item.forEach(push);
    else if (item === Object(item))
      Object.keys(item).forEach((name) => {
        if (item[name])
          push(name);
      });
    else {
      item = item === false || item == null ? "" : String(item).trim();
      if (item) {
        item.split(/\s+/).forEach((name) => {
          hash[name] = true;
        });
      }
    }
  }
}

const HydrationDirectivesRaw = ["load", "idle", "media", "visible", "only"];
const HydrationDirectives = new Set(HydrationDirectivesRaw);
const HydrationDirectiveProps = new Set(HydrationDirectivesRaw.map((n) => `client:${n}`));
function extractDirectives(inputProps) {
  let extracted = {
    isPage: false,
    hydration: null,
    props: {}
  };
  for (const [key, value] of Object.entries(inputProps)) {
    if (key.startsWith("server:")) {
      if (key === "server:root") {
        extracted.isPage = true;
      }
    }
    if (key.startsWith("client:")) {
      if (!extracted.hydration) {
        extracted.hydration = {
          directive: "",
          value: "",
          componentUrl: "",
          componentExport: { value: "" }
        };
      }
      switch (key) {
        case "client:component-path": {
          extracted.hydration.componentUrl = value;
          break;
        }
        case "client:component-export": {
          extracted.hydration.componentExport.value = value;
          break;
        }
        case "client:component-hydration": {
          break;
        }
        case "client:display-name": {
          break;
        }
        default: {
          extracted.hydration.directive = key.split(":")[1];
          extracted.hydration.value = value;
          if (!HydrationDirectives.has(extracted.hydration.directive)) {
            throw new Error(
              `Error: invalid hydration directive "${key}". Supported hydration methods: ${Array.from(
                HydrationDirectiveProps
              ).join(", ")}`
            );
          }
          if (extracted.hydration.directive === "media" && typeof extracted.hydration.value !== "string") {
            throw new Error(
              'Error: Media query must be provided for "client:media", similar to client:media="(max-width: 600px)"'
            );
          }
          break;
        }
      }
    } else if (key === "class:list") {
      extracted.props[key.slice(0, -5)] = serializeListValue(value);
    } else {
      extracted.props[key] = value;
    }
  }
  return extracted;
}
async function generateHydrateScript(scriptOptions, metadata) {
  const { renderer, result, astroId, props, attrs } = scriptOptions;
  const { hydrate, componentUrl, componentExport } = metadata;
  if (!componentExport.value) {
    throw new Error(
      `Unable to resolve a valid export for "${metadata.displayName}"! Please open an issue at https://astro.build/issues!`
    );
  }
  const island = {
    children: "",
    props: {
      uid: astroId
    }
  };
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      island.props[key] = value;
    }
  }
  island.props["component-url"] = await result.resolve(componentUrl);
  if (renderer.clientEntrypoint) {
    island.props["component-export"] = componentExport.value;
    island.props["renderer-url"] = await result.resolve(renderer.clientEntrypoint);
    island.props["props"] = escapeHTML(serializeProps(props));
  }
  island.props["ssr"] = "";
  island.props["client"] = hydrate;
  island.props["before-hydration-url"] = await result.resolve("astro:scripts/before-hydration.js");
  island.props["opts"] = escapeHTML(
    JSON.stringify({
      name: metadata.displayName,
      value: metadata.hydrateArgs || ""
    })
  );
  return island;
}

var idle_prebuilt_default = `(self.Astro=self.Astro||{}).idle=t=>{const e=async()=>{await(await t())()};"requestIdleCallback"in window?window.requestIdleCallback(e):setTimeout(e,200)},window.dispatchEvent(new Event("astro:idle"));`;

var load_prebuilt_default = `(self.Astro=self.Astro||{}).load=a=>{(async()=>await(await a())())()},window.dispatchEvent(new Event("astro:load"));`;

var media_prebuilt_default = `(self.Astro=self.Astro||{}).media=(s,a)=>{const t=async()=>{await(await s())()};if(a.value){const e=matchMedia(a.value);e.matches?t():e.addEventListener("change",t,{once:!0})}},window.dispatchEvent(new Event("astro:media"));`;

var only_prebuilt_default = `(self.Astro=self.Astro||{}).only=t=>{(async()=>await(await t())())()},window.dispatchEvent(new Event("astro:only"));`;

var visible_prebuilt_default = `(self.Astro=self.Astro||{}).visible=(s,c,n)=>{const r=async()=>{await(await s())()};let i=new IntersectionObserver(e=>{for(const t of e)if(!!t.isIntersecting){i.disconnect(),r();break}});for(let e=0;e<n.children.length;e++){const t=n.children[e];i.observe(t)}},window.dispatchEvent(new Event("astro:visible"));`;

var astro_island_prebuilt_default = `var d;{const l={0:t=>t,1:t=>JSON.parse(t,n),2:t=>new RegExp(t),3:t=>new Date(t),4:t=>new Map(JSON.parse(t,n)),5:t=>new Set(JSON.parse(t,n)),6:t=>BigInt(t),7:t=>new URL(t)},n=(t,r)=>{if(t===""||!Array.isArray(r))return r;const[e,i]=r;return e in l?l[e](i):void 0};customElements.get("astro-island")||customElements.define("astro-island",(d=class extends HTMLElement{constructor(){super(...arguments);this.hydrate=()=>{if(!this.hydrator||this.parentElement?.closest("astro-island[ssr]"))return;const r=this.querySelectorAll("astro-slot"),e={},i=this.querySelectorAll("template[data-astro-template]");for(const s of i)!s.closest(this.tagName)?.isSameNode(this)||(e[s.getAttribute("data-astro-template")||"default"]=s.innerHTML,s.remove());for(const s of r)!s.closest(this.tagName)?.isSameNode(this)||(e[s.getAttribute("name")||"default"]=s.innerHTML);const o=this.hasAttribute("props")?JSON.parse(this.getAttribute("props"),n):{};this.hydrator(this)(this.Component,o,e,{client:this.getAttribute("client")}),this.removeAttribute("ssr"),window.removeEventListener("astro:hydrate",this.hydrate),window.dispatchEvent(new CustomEvent("astro:hydrate"))}}connectedCallback(){!this.hasAttribute("await-children")||this.firstChild?this.childrenConnectedCallback():new MutationObserver((r,e)=>{e.disconnect(),this.childrenConnectedCallback()}).observe(this,{childList:!0})}async childrenConnectedCallback(){window.addEventListener("astro:hydrate",this.hydrate),await import(this.getAttribute("before-hydration-url")),this.start()}start(){const r=JSON.parse(this.getAttribute("opts")),e=this.getAttribute("client");if(Astro[e]===void 0){window.addEventListener(\`astro:\${e}\`,()=>this.start(),{once:!0});return}Astro[e](async()=>{const i=this.getAttribute("renderer-url"),[o,{default:s}]=await Promise.all([import(this.getAttribute("component-url")),i?import(i):()=>()=>{}]),a=this.getAttribute("component-export")||"default";if(!a.includes("."))this.Component=o[a];else{this.Component=o;for(const c of a.split("."))this.Component=this.Component[c]}return this.hydrator=s,this.hydrate},r,this)}attributeChangedCallback(){this.hydrator&&this.hydrate()}},d.observedAttributes=["props"],d))}`;

function determineIfNeedsHydrationScript(result) {
  if (result._metadata.hasHydrationScript) {
    return false;
  }
  return result._metadata.hasHydrationScript = true;
}
const hydrationScripts = {
  idle: idle_prebuilt_default,
  load: load_prebuilt_default,
  only: only_prebuilt_default,
  media: media_prebuilt_default,
  visible: visible_prebuilt_default
};
function determinesIfNeedsDirectiveScript(result, directive) {
  if (result._metadata.hasDirectives.has(directive)) {
    return false;
  }
  result._metadata.hasDirectives.add(directive);
  return true;
}
function getDirectiveScriptText(directive) {
  if (!(directive in hydrationScripts)) {
    throw new Error(`Unknown directive: ${directive}`);
  }
  const directiveScriptText = hydrationScripts[directive];
  return directiveScriptText;
}
function getPrescripts(type, directive) {
  switch (type) {
    case "both":
      return `<style>astro-island,astro-slot{display:contents}</style><script>${getDirectiveScriptText(directive) + astro_island_prebuilt_default}<\/script>`;
    case "directive":
      return `<script>${getDirectiveScriptText(directive)}<\/script>`;
  }
  return "";
}

const Fragment = Symbol.for("astro:fragment");
const Renderer = Symbol.for("astro:renderer");
function stringifyChunk(result, chunk) {
  switch (chunk.type) {
    case "directive": {
      const { hydration } = chunk;
      let needsHydrationScript = hydration && determineIfNeedsHydrationScript(result);
      let needsDirectiveScript = hydration && determinesIfNeedsDirectiveScript(result, hydration.directive);
      let prescriptType = needsHydrationScript ? "both" : needsDirectiveScript ? "directive" : null;
      if (prescriptType) {
        let prescripts = getPrescripts(prescriptType, hydration.directive);
        return markHTMLString(prescripts);
      } else {
        return "";
      }
    }
    default: {
      return chunk.toString();
    }
  }
}

function validateComponentProps(props, displayName) {
  var _a;
  if (((_a = (Object.assign({"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true},{_:process.env._,}))) == null ? void 0 : _a.DEV) && props != null) {
    for (const prop of Object.keys(props)) {
      if (HydrationDirectiveProps.has(prop)) {
        console.warn(
          `You are attempting to render <${displayName} ${prop} />, but ${displayName} is an Astro component. Astro components do not render in the client and should not have a hydration directive. Please use a framework component for client rendering.`
        );
      }
    }
  }
}
class AstroComponent {
  constructor(htmlParts, expressions) {
    this.htmlParts = htmlParts;
    this.expressions = expressions;
  }
  get [Symbol.toStringTag]() {
    return "AstroComponent";
  }
  async *[Symbol.asyncIterator]() {
    const { htmlParts, expressions } = this;
    for (let i = 0; i < htmlParts.length; i++) {
      const html = htmlParts[i];
      const expression = expressions[i];
      yield markHTMLString(html);
      yield* renderChild(expression);
    }
  }
}
function isAstroComponent(obj) {
  return typeof obj === "object" && Object.prototype.toString.call(obj) === "[object AstroComponent]";
}
function isAstroComponentFactory(obj) {
  return obj == null ? false : !!obj.isAstroComponentFactory;
}
async function* renderAstroComponent(component) {
  for await (const value of component) {
    if (value || value === 0) {
      for await (const chunk of renderChild(value)) {
        switch (chunk.type) {
          case "directive": {
            yield chunk;
            break;
          }
          default: {
            yield markHTMLString(chunk);
            break;
          }
        }
      }
    }
  }
}
async function renderToString(result, componentFactory, props, children) {
  const Component = await componentFactory(result, props, children);
  if (!isAstroComponent(Component)) {
    const response = Component;
    throw response;
  }
  let html = "";
  for await (const chunk of renderAstroComponent(Component)) {
    html += stringifyChunk(result, chunk);
  }
  return html;
}
async function renderToIterable(result, componentFactory, displayName, props, children) {
  validateComponentProps(props, displayName);
  const Component = await componentFactory(result, props, children);
  if (!isAstroComponent(Component)) {
    console.warn(
      `Returning a Response is only supported inside of page components. Consider refactoring this logic into something like a function that can be used in the page.`
    );
    const response = Component;
    throw response;
  }
  return renderAstroComponent(Component);
}
async function renderTemplate(htmlParts, ...expressions) {
  return new AstroComponent(htmlParts, expressions);
}

async function* renderChild(child) {
  child = await child;
  if (child instanceof HTMLString) {
    yield child;
  } else if (Array.isArray(child)) {
    for (const value of child) {
      yield markHTMLString(await renderChild(value));
    }
  } else if (typeof child === "function") {
    yield* renderChild(child());
  } else if (typeof child === "string") {
    yield markHTMLString(escapeHTML(child));
  } else if (!child && child !== 0) ; else if (child instanceof AstroComponent || Object.prototype.toString.call(child) === "[object AstroComponent]") {
    yield* renderAstroComponent(child);
  } else if (typeof child === "object" && Symbol.asyncIterator in child) {
    yield* child;
  } else {
    yield child;
  }
}
async function renderSlot(result, slotted, fallback) {
  if (slotted) {
    let iterator = renderChild(slotted);
    let content = "";
    for await (const chunk of iterator) {
      if (chunk.type === "directive") {
        content += stringifyChunk(result, chunk);
      } else {
        content += chunk;
      }
    }
    return markHTMLString(content);
  }
  return fallback;
}

/**
 * shortdash - https://github.com/bibig/node-shorthash
 *
 * @license
 *
 * (The MIT License)
 *
 * Copyright (c) 2013 Bibig <bibig@me.com>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
const dictionary = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY";
const binary = dictionary.length;
function bitwise(str) {
  let hash = 0;
  if (str.length === 0)
    return hash;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash = hash & hash;
  }
  return hash;
}
function shorthash(text) {
  let num;
  let result = "";
  let integer = bitwise(text);
  const sign = integer < 0 ? "Z" : "";
  integer = Math.abs(integer);
  while (integer >= binary) {
    num = integer % binary;
    integer = Math.floor(integer / binary);
    result = dictionary[num] + result;
  }
  if (integer > 0) {
    result = dictionary[integer] + result;
  }
  return sign + result;
}

const voidElementNames = /^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i;
const htmlBooleanAttributes = /^(allowfullscreen|async|autofocus|autoplay|controls|default|defer|disabled|disablepictureinpicture|disableremoteplayback|formnovalidate|hidden|loop|nomodule|novalidate|open|playsinline|readonly|required|reversed|scoped|seamless|itemscope)$/i;
const htmlEnumAttributes = /^(contenteditable|draggable|spellcheck|value)$/i;
const svgEnumAttributes = /^(autoReverse|externalResourcesRequired|focusable|preserveAlpha)$/i;
const STATIC_DIRECTIVES = /* @__PURE__ */ new Set(["set:html", "set:text"]);
const toIdent = (k) => k.trim().replace(/(?:(?<!^)\b\w|\s+|[^\w]+)/g, (match, index) => {
  if (/[^\w]|\s/.test(match))
    return "";
  return index === 0 ? match : match.toUpperCase();
});
const toAttributeString = (value, shouldEscape = true) => shouldEscape ? String(value).replace(/&/g, "&#38;").replace(/"/g, "&#34;") : value;
const kebab = (k) => k.toLowerCase() === k ? k : k.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
const toStyleString = (obj) => Object.entries(obj).map(([k, v]) => `${kebab(k)}:${v}`).join(";");
function defineScriptVars(vars) {
  let output = "";
  for (const [key, value] of Object.entries(vars)) {
    output += `let ${toIdent(key)} = ${JSON.stringify(value)};
`;
  }
  return markHTMLString(output);
}
function formatList(values) {
  if (values.length === 1) {
    return values[0];
  }
  return `${values.slice(0, -1).join(", ")} or ${values[values.length - 1]}`;
}
function addAttribute(value, key, shouldEscape = true) {
  if (value == null) {
    return "";
  }
  if (value === false) {
    if (htmlEnumAttributes.test(key) || svgEnumAttributes.test(key)) {
      return markHTMLString(` ${key}="false"`);
    }
    return "";
  }
  if (STATIC_DIRECTIVES.has(key)) {
    console.warn(`[astro] The "${key}" directive cannot be applied dynamically at runtime. It will not be rendered as an attribute.

Make sure to use the static attribute syntax (\`${key}={value}\`) instead of the dynamic spread syntax (\`{...{ "${key}": value }}\`).`);
    return "";
  }
  if (key === "class:list") {
    const listValue = toAttributeString(serializeListValue(value));
    if (listValue === "") {
      return "";
    }
    return markHTMLString(` ${key.slice(0, -5)}="${listValue}"`);
  }
  if (key === "style" && !(value instanceof HTMLString) && typeof value === "object") {
    return markHTMLString(` ${key}="${toStyleString(value)}"`);
  }
  if (key === "className") {
    return markHTMLString(` class="${toAttributeString(value, shouldEscape)}"`);
  }
  if (value === true && (key.startsWith("data-") || htmlBooleanAttributes.test(key))) {
    return markHTMLString(` ${key}`);
  } else {
    return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
  }
}
function internalSpreadAttributes(values, shouldEscape = true) {
  let output = "";
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute(value, key, shouldEscape);
  }
  return markHTMLString(output);
}
function renderElement$1(name, { props: _props, children = "" }, shouldEscape = true) {
  const { lang: _, "data-astro-id": astroId, "define:vars": defineVars, ...props } = _props;
  if (defineVars) {
    if (name === "style") {
      delete props["is:global"];
      delete props["is:scoped"];
    }
    if (name === "script") {
      delete props.hoist;
      children = defineScriptVars(defineVars) + "\n" + children;
    }
  }
  if ((children == null || children == "") && voidElementNames.test(name)) {
    return `<${name}${internalSpreadAttributes(props, shouldEscape)} />`;
  }
  return `<${name}${internalSpreadAttributes(props, shouldEscape)}>${children}</${name}>`;
}

function componentIsHTMLElement(Component) {
  return typeof HTMLElement !== "undefined" && HTMLElement.isPrototypeOf(Component);
}
async function renderHTMLElement(result, constructor, props, slots) {
  const name = getHTMLElementName(constructor);
  let attrHTML = "";
  for (const attr in props) {
    attrHTML += ` ${attr}="${toAttributeString(await props[attr])}"`;
  }
  return markHTMLString(
    `<${name}${attrHTML}>${await renderSlot(result, slots == null ? void 0 : slots.default)}</${name}>`
  );
}
function getHTMLElementName(constructor) {
  const definedName = customElements.getName(constructor);
  if (definedName)
    return definedName;
  const assignedName = constructor.name.replace(/^HTML|Element$/g, "").replace(/[A-Z]/g, "-$&").toLowerCase().replace(/^-/, "html-");
  return assignedName;
}

const rendererAliases = /* @__PURE__ */ new Map([["solid", "solid-js"]]);
function guessRenderers(componentUrl) {
  const extname = componentUrl == null ? void 0 : componentUrl.split(".").pop();
  switch (extname) {
    case "svelte":
      return ["@astrojs/svelte"];
    case "vue":
      return ["@astrojs/vue"];
    case "jsx":
    case "tsx":
      return ["@astrojs/react", "@astrojs/preact"];
    default:
      return ["@astrojs/react", "@astrojs/preact", "@astrojs/vue", "@astrojs/svelte"];
  }
}
function getComponentType(Component) {
  if (Component === Fragment) {
    return "fragment";
  }
  if (Component && typeof Component === "object" && Component["astro:html"]) {
    return "html";
  }
  if (isAstroComponentFactory(Component)) {
    return "astro-factory";
  }
  return "unknown";
}
async function renderComponent(result, displayName, Component, _props, slots = {}) {
  var _a;
  Component = await Component;
  switch (getComponentType(Component)) {
    case "fragment": {
      const children2 = await renderSlot(result, slots == null ? void 0 : slots.default);
      if (children2 == null) {
        return children2;
      }
      return markHTMLString(children2);
    }
    case "html": {
      const children2 = {};
      if (slots) {
        await Promise.all(
          Object.entries(slots).map(
            ([key, value]) => renderSlot(result, value).then((output) => {
              children2[key] = output;
            })
          )
        );
      }
      const html2 = Component.render({ slots: children2 });
      return markHTMLString(html2);
    }
    case "astro-factory": {
      async function* renderAstroComponentInline() {
        let iterable = await renderToIterable(result, Component, displayName, _props, slots);
        yield* iterable;
      }
      return renderAstroComponentInline();
    }
  }
  if (!Component && !_props["client:only"]) {
    throw new Error(
      `Unable to render ${displayName} because it is ${Component}!
Did you forget to import the component or is it possible there is a typo?`
    );
  }
  const { renderers } = result._metadata;
  const metadata = { displayName };
  const { hydration, isPage, props } = extractDirectives(_props);
  let html = "";
  let attrs = void 0;
  if (hydration) {
    metadata.hydrate = hydration.directive;
    metadata.hydrateArgs = hydration.value;
    metadata.componentExport = hydration.componentExport;
    metadata.componentUrl = hydration.componentUrl;
  }
  const probableRendererNames = guessRenderers(metadata.componentUrl);
  if (Array.isArray(renderers) && renderers.length === 0 && typeof Component !== "string" && !componentIsHTMLElement(Component)) {
    const message = `Unable to render ${metadata.displayName}!

There are no \`integrations\` set in your \`astro.config.mjs\` file.
Did you mean to add ${formatList(probableRendererNames.map((r) => "`" + r + "`"))}?`;
    throw new Error(message);
  }
  const children = {};
  if (slots) {
    await Promise.all(
      Object.entries(slots).map(
        ([key, value]) => renderSlot(result, value).then((output) => {
          children[key] = output;
        })
      )
    );
  }
  let renderer;
  if (metadata.hydrate !== "only") {
    if (Component && Component[Renderer]) {
      const rendererName = Component[Renderer];
      renderer = renderers.find(({ name }) => name === rendererName);
    }
    if (!renderer) {
      let error;
      for (const r of renderers) {
        try {
          if (await r.ssr.check.call({ result }, Component, props, children)) {
            renderer = r;
            break;
          }
        } catch (e) {
          error ?? (error = e);
        }
      }
      if (!renderer && error) {
        throw error;
      }
    }
    if (!renderer && typeof HTMLElement === "function" && componentIsHTMLElement(Component)) {
      const output = renderHTMLElement(result, Component, _props, slots);
      return output;
    }
  } else {
    if (metadata.hydrateArgs) {
      const passedName = metadata.hydrateArgs;
      const rendererName = rendererAliases.has(passedName) ? rendererAliases.get(passedName) : passedName;
      renderer = renderers.find(
        ({ name }) => name === `@astrojs/${rendererName}` || name === rendererName
      );
    }
    if (!renderer && renderers.length === 1) {
      renderer = renderers[0];
    }
    if (!renderer) {
      const extname = (_a = metadata.componentUrl) == null ? void 0 : _a.split(".").pop();
      renderer = renderers.filter(
        ({ name }) => name === `@astrojs/${extname}` || name === extname
      )[0];
    }
  }
  if (!renderer) {
    if (metadata.hydrate === "only") {
      throw new Error(`Unable to render ${metadata.displayName}!

Using the \`client:only\` hydration strategy, Astro needs a hint to use the correct renderer.
Did you mean to pass <${metadata.displayName} client:only="${probableRendererNames.map((r) => r.replace("@astrojs/", "")).join("|")}" />
`);
    } else if (typeof Component !== "string") {
      const matchingRenderers = renderers.filter((r) => probableRendererNames.includes(r.name));
      const plural = renderers.length > 1;
      if (matchingRenderers.length === 0) {
        throw new Error(`Unable to render ${metadata.displayName}!

There ${plural ? "are" : "is"} ${renderers.length} renderer${plural ? "s" : ""} configured in your \`astro.config.mjs\` file,
but ${plural ? "none were" : "it was not"} able to server-side render ${metadata.displayName}.

Did you mean to enable ${formatList(probableRendererNames.map((r) => "`" + r + "`"))}?`);
      } else if (matchingRenderers.length === 1) {
        renderer = matchingRenderers[0];
        ({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
          { result },
          Component,
          props,
          children,
          metadata
        ));
      } else {
        throw new Error(`Unable to render ${metadata.displayName}!

This component likely uses ${formatList(probableRendererNames)},
but Astro encountered an error during server-side rendering.

Please ensure that ${metadata.displayName}:
1. Does not unconditionally access browser-specific globals like \`window\` or \`document\`.
   If this is unavoidable, use the \`client:only\` hydration directive.
2. Does not conditionally return \`null\` or \`undefined\` when rendered on the server.

If you're still stuck, please open an issue on GitHub or join us at https://astro.build/chat.`);
      }
    }
  } else {
    if (metadata.hydrate === "only") {
      html = await renderSlot(result, slots == null ? void 0 : slots.fallback);
    } else {
      ({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
        { result },
        Component,
        props,
        children,
        metadata
      ));
    }
  }
  if (renderer && !renderer.clientEntrypoint && renderer.name !== "@astrojs/lit" && metadata.hydrate) {
    throw new Error(
      `${metadata.displayName} component has a \`client:${metadata.hydrate}\` directive, but no client entrypoint was provided by ${renderer.name}!`
    );
  }
  if (!html && typeof Component === "string") {
    const childSlots = Object.values(children).join("");
    const iterable = renderAstroComponent(
      await renderTemplate`<${Component}${internalSpreadAttributes(props)}${markHTMLString(
        childSlots === "" && voidElementNames.test(Component) ? `/>` : `>${childSlots}</${Component}>`
      )}`
    );
    html = "";
    for await (const chunk of iterable) {
      html += chunk;
    }
  }
  if (!hydration) {
    if (isPage || (renderer == null ? void 0 : renderer.name) === "astro:jsx") {
      return html;
    }
    return markHTMLString(html.replace(/\<\/?astro-slot\>/g, ""));
  }
  const astroId = shorthash(
    `<!--${metadata.componentExport.value}:${metadata.componentUrl}-->
${html}
${serializeProps(
      props
    )}`
  );
  const island = await generateHydrateScript(
    { renderer, result, astroId, props, attrs },
    metadata
  );
  let unrenderedSlots = [];
  if (html) {
    if (Object.keys(children).length > 0) {
      for (const key of Object.keys(children)) {
        if (!html.includes(key === "default" ? `<astro-slot>` : `<astro-slot name="${key}">`)) {
          unrenderedSlots.push(key);
        }
      }
    }
  } else {
    unrenderedSlots = Object.keys(children);
  }
  const template = unrenderedSlots.length > 0 ? unrenderedSlots.map(
    (key) => `<template data-astro-template${key !== "default" ? `="${key}"` : ""}>${children[key]}</template>`
  ).join("") : "";
  island.children = `${html ?? ""}${template}`;
  if (island.children) {
    island.props["await-children"] = "";
  }
  async function* renderAll() {
    yield { type: "directive", hydration, result };
    yield markHTMLString(renderElement$1("astro-island", island, false));
  }
  return renderAll();
}

const uniqueElements = (item, index, all) => {
  const props = JSON.stringify(item.props);
  const children = item.children;
  return index === all.findIndex((i) => JSON.stringify(i.props) === props && i.children == children);
};
const alreadyHeadRenderedResults = /* @__PURE__ */ new WeakSet();
function renderHead(result) {
  alreadyHeadRenderedResults.add(result);
  const styles = Array.from(result.styles).filter(uniqueElements).map((style) => renderElement$1("style", style));
  result.styles.clear();
  const scripts = Array.from(result.scripts).filter(uniqueElements).map((script, i) => {
    return renderElement$1("script", script, false);
  });
  const links = Array.from(result.links).filter(uniqueElements).map((link) => renderElement$1("link", link, false));
  return markHTMLString(links.join("\n") + styles.join("\n") + scripts.join("\n"));
}
async function* maybeRenderHead(result) {
  if (alreadyHeadRenderedResults.has(result)) {
    return;
  }
  yield renderHead(result);
}

typeof process === "object" && Object.prototype.toString.call(process) === "[object process]";

new TextEncoder();

function createComponent(cb) {
  cb.isAstroComponentFactory = true;
  return cb;
}
function spreadAttributes(values, _name, { class: scopedClassName } = {}) {
  let output = "";
  if (scopedClassName) {
    if (typeof values.class !== "undefined") {
      values.class += ` ${scopedClassName}`;
    } else if (typeof values["class:list"] !== "undefined") {
      values["class:list"] = [values["class:list"], scopedClassName];
    } else {
      values.class = scopedClassName;
    }
  }
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute(value, key, true);
  }
  return markHTMLString(output);
}

const AstroJSX = "astro:jsx";
const Empty = Symbol("empty");
const toSlotName = (str) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());
function isVNode(vnode) {
  return vnode && typeof vnode === "object" && vnode[AstroJSX];
}
function transformSlots(vnode) {
  if (typeof vnode.type === "string")
    return vnode;
  const slots = {};
  if (isVNode(vnode.props.children)) {
    const child = vnode.props.children;
    if (!isVNode(child))
      return;
    if (!("slot" in child.props))
      return;
    const name = toSlotName(child.props.slot);
    slots[name] = [child];
    slots[name]["$$slot"] = true;
    delete child.props.slot;
    delete vnode.props.children;
  }
  if (Array.isArray(vnode.props.children)) {
    vnode.props.children = vnode.props.children.map((child) => {
      if (!isVNode(child))
        return child;
      if (!("slot" in child.props))
        return child;
      const name = toSlotName(child.props.slot);
      if (Array.isArray(slots[name])) {
        slots[name].push(child);
      } else {
        slots[name] = [child];
        slots[name]["$$slot"] = true;
      }
      delete child.props.slot;
      return Empty;
    }).filter((v) => v !== Empty);
  }
  Object.assign(vnode.props, slots);
}
function markRawChildren(child) {
  if (typeof child === "string")
    return markHTMLString(child);
  if (Array.isArray(child))
    return child.map((c) => markRawChildren(c));
  return child;
}
function transformSetDirectives(vnode) {
  if (!("set:html" in vnode.props || "set:text" in vnode.props))
    return;
  if ("set:html" in vnode.props) {
    const children = markRawChildren(vnode.props["set:html"]);
    delete vnode.props["set:html"];
    Object.assign(vnode.props, { children });
    return;
  }
  if ("set:text" in vnode.props) {
    const children = vnode.props["set:text"];
    delete vnode.props["set:text"];
    Object.assign(vnode.props, { children });
    return;
  }
}
function createVNode(type, props) {
  const vnode = {
    [AstroJSX]: true,
    type,
    props: props ?? {}
  };
  transformSetDirectives(vnode);
  transformSlots(vnode);
  return vnode;
}

const ClientOnlyPlaceholder = "astro-client-only";
const skipAstroJSXCheck = /* @__PURE__ */ new WeakSet();
let originalConsoleError;
let consoleFilterRefs = 0;
async function renderJSX(result, vnode) {
  switch (true) {
    case vnode instanceof HTMLString:
      if (vnode.toString().trim() === "") {
        return "";
      }
      return vnode;
    case typeof vnode === "string":
      return markHTMLString(escapeHTML(vnode));
    case (!vnode && vnode !== 0):
      return "";
    case Array.isArray(vnode):
      return markHTMLString(
        (await Promise.all(vnode.map((v) => renderJSX(result, v)))).join("")
      );
  }
  if (isVNode(vnode)) {
    switch (true) {
      case vnode.type === Symbol.for("astro:fragment"):
        return renderJSX(result, vnode.props.children);
      case vnode.type.isAstroComponentFactory: {
        let props = {};
        let slots = {};
        for (const [key, value] of Object.entries(vnode.props ?? {})) {
          if (key === "children" || value && typeof value === "object" && value["$$slot"]) {
            slots[key === "children" ? "default" : key] = () => renderJSX(result, value);
          } else {
            props[key] = value;
          }
        }
        return markHTMLString(await renderToString(result, vnode.type, props, slots));
      }
      case (!vnode.type && vnode.type !== 0):
        return "";
      case (typeof vnode.type === "string" && vnode.type !== ClientOnlyPlaceholder):
        return markHTMLString(await renderElement(result, vnode.type, vnode.props ?? {}));
    }
    if (vnode.type) {
      let extractSlots2 = function(child) {
        if (Array.isArray(child)) {
          return child.map((c) => extractSlots2(c));
        }
        if (!isVNode(child)) {
          _slots.default.push(child);
          return;
        }
        if ("slot" in child.props) {
          _slots[child.props.slot] = [..._slots[child.props.slot] ?? [], child];
          delete child.props.slot;
          return;
        }
        _slots.default.push(child);
      };
      if (typeof vnode.type === "function" && vnode.type["astro:renderer"]) {
        skipAstroJSXCheck.add(vnode.type);
      }
      if (typeof vnode.type === "function" && vnode.props["server:root"]) {
        const output2 = await vnode.type(vnode.props ?? {});
        return await renderJSX(result, output2);
      }
      if (typeof vnode.type === "function" && !skipAstroJSXCheck.has(vnode.type)) {
        useConsoleFilter();
        try {
          const output2 = await vnode.type(vnode.props ?? {});
          if (output2 && output2[AstroJSX]) {
            return await renderJSX(result, output2);
          } else if (!output2) {
            return await renderJSX(result, output2);
          }
        } catch (e) {
          skipAstroJSXCheck.add(vnode.type);
        } finally {
          finishUsingConsoleFilter();
        }
      }
      const { children = null, ...props } = vnode.props ?? {};
      const _slots = {
        default: []
      };
      extractSlots2(children);
      for (const [key, value] of Object.entries(props)) {
        if (value["$$slot"]) {
          _slots[key] = value;
          delete props[key];
        }
      }
      const slotPromises = [];
      const slots = {};
      for (const [key, value] of Object.entries(_slots)) {
        slotPromises.push(
          renderJSX(result, value).then((output2) => {
            if (output2.toString().trim().length === 0)
              return;
            slots[key] = () => output2;
          })
        );
      }
      await Promise.all(slotPromises);
      let output;
      if (vnode.type === ClientOnlyPlaceholder && vnode.props["client:only"]) {
        output = await renderComponent(
          result,
          vnode.props["client:display-name"] ?? "",
          null,
          props,
          slots
        );
      } else {
        output = await renderComponent(
          result,
          typeof vnode.type === "function" ? vnode.type.name : vnode.type,
          vnode.type,
          props,
          slots
        );
      }
      if (typeof output !== "string" && Symbol.asyncIterator in output) {
        let body = "";
        for await (const chunk of output) {
          let html = stringifyChunk(result, chunk);
          body += html;
        }
        return markHTMLString(body);
      } else {
        return markHTMLString(output);
      }
    }
  }
  return markHTMLString(`${vnode}`);
}
async function renderElement(result, tag, { children, ...props }) {
  return markHTMLString(
    `<${tag}${spreadAttributes(props)}${markHTMLString(
      (children == null || children == "") && voidElementNames.test(tag) ? `/>` : `>${children == null ? "" : await renderJSX(result, children)}</${tag}>`
    )}`
  );
}
function useConsoleFilter() {
  consoleFilterRefs++;
  if (!originalConsoleError) {
    originalConsoleError = console.error;
    try {
      console.error = filteredConsoleError;
    } catch (error) {
    }
  }
}
function finishUsingConsoleFilter() {
  consoleFilterRefs--;
}
function filteredConsoleError(msg, ...rest) {
  if (consoleFilterRefs > 0 && typeof msg === "string") {
    const isKnownReactHookError = msg.includes("Warning: Invalid hook call.") && msg.includes("https://reactjs.org/link/invalid-hook-call");
    if (isKnownReactHookError)
      return;
  }
}

const slotName = (str) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());
async function check(Component, props, { default: children = null, ...slotted } = {}) {
  if (typeof Component !== "function")
    return false;
  const slots = {};
  for (const [key, value] of Object.entries(slotted)) {
    const name = slotName(key);
    slots[name] = value;
  }
  try {
    const result = await Component({ ...props, ...slots, children });
    return result[AstroJSX];
  } catch (e) {
  }
  return false;
}
async function renderToStaticMarkup(Component, props = {}, { default: children = null, ...slotted } = {}) {
  const slots = {};
  for (const [key, value] of Object.entries(slotted)) {
    const name = slotName(key);
    slots[name] = value;
  }
  const { result } = this;
  const html = await renderJSX(result, createVNode(Component, { ...props, ...slots, children }));
  return { html };
}
var server_default = {
  check,
  renderToStaticMarkup
};

const $$metadata$4 = createMetadata("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/src/components/MainHead.astro", { modules: [], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$9 = createAstro("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/src/components/MainHead.astro", "", "file:///C:/Users/Andrei/Sites/astro-solid-shop/");
const $$MainHead = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$9, $$props, $$slots);
  Astro2.self = $$MainHead;
  const {
    title = "Astro Shop",
    description = "A simple shop built with Astro and SolidJS"
  } = Astro2.props;
  return renderTemplate`<meta charset="UTF-8">
<meta name="description" property="og:description"${addAttribute(description, "content")}>
<meta name="viewport" content="width=device-width">
<meta name="generator"${addAttribute(Astro2.generator, "content")}>
<title>${title}</title>

<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;400;700;900&display=swap" rel="stylesheet">
`;
});

const $$file$4 = "C:/Users/Andrei/Sites/astro-solid-shop/src/components/MainHead.astro";
const $$url$4 = undefined;

const $$module1$6 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$4,
	default: $$MainHead,
	file: $$file$4,
	url: $$url$4
}, Symbol.toStringTag, { value: 'Module' }));

const menuItems = [
  {
    name: "Pacienti",
    href: "/#",
    items: [
      {
        name: "Analize medicale si preturi",
        items: [
          { name: "Teste A-Z" },
          { name: "Pachete analize medicale" },
          { name: "Senzorul de sanatate" },
          { name: "Plansa anatomica" },
          { name: "Oferte speciale" }
        ]
      },
      {
        name: "Atelierul de sanatate",
        items: [
          { name: "Sfatul medicului" },
          { name: "Sanatatea sub microscop" },
          { name: "Sanatatea prenatala" },
          { name: "Revista noastra" }
        ]
      },
      {
        name: "Informatii utile",
        items: [
          { name: "Ultimele stiri" },
          { name: "Pregatirea pentru analize" },
          { name: "Intrebari frecvente" },
          { name: "Asiguratii CAS" },
          { name: "Locatii" }
        ]
      }
    ]
  },
  {
    name: "Medici",
    items: [
      {
        name: "Dictionar Medical",
        items: [
          { name: "Teste A-Z" },
          { name: "Profile afectiuni" }
        ]
      },
      {
        name: "Informatii medicale",
        items: [
          { name: "Stiri" },
          { name: "Statistici" },
          { name: "Articole" },
          { name: "Evenimente" },
          { name: "Jurnal de laborator" }
        ]
      },
      {
        name: "Colaborare",
        items: [
          { name: "Despre noi" },
          { name: "Medicii nostri" },
          { name: "Certificari, acreditari si aparatura" },
          { name: "Cere o oferta" }
        ]
      }
    ]
  },
  {
    name: "Despre noi",
    items: [
      { name: "Compania" },
      { name: "Locatii" },
      { name: "Laboratorul Central de Referinta" },
      { name: "Presa" },
      { name: "Satisfactia Clientului" },
      { name: "Cariere" }
    ]
  },
  { name: "Contact" }
];

const $$module1$5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	menuItems
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$3 = createMetadata("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/src/components/Header/Header.astro", { modules: [{ module: $$module1$5, specifier: "~/lib/menu-items", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [{ type: "inline", value: `
  var headerCompactValue = 25;
  window.addEventListener('scroll', function() {
    let newCompact = 15 - Math.round((Math.min(window.scrollY, 300) / 300) * 15) +10;
    if (newCompact != headerCompactValue) {
      if (document.getElementById('header')) {
        document.getElementById('header').className = 'header header-p-'+newCompact;
      }
      headerCompactValue = newCompact;
    }
  });
` }] });
const $$Astro$8 = createAstro("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/src/components/Header/Header.astro", "", "file:///C:/Users/Andrei/Sites/astro-solid-shop/");
const $$Header = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$8, $$props, $$slots);
  Astro2.self = $$Header;
  const { pathname } = Astro2.url;
  return renderTemplate`
${maybeRenderHead($$result)}<header>
  <div${addAttribute(`header header-p-25`, "class")} id="header">
    <div class="header-inner">
      <section class="logo">
        <a href="/">Shop</a>
      </section>
      <nav>
        ${menuItems.map((item) => {
    let isDeep = false;
    if (item.items && item.items?.length > 0) {
      item.items.forEach((subItem) => {
        if (subItem.items && subItem.items?.length > 0)
          isDeep = true;
      });
    }
    return renderTemplate`<div${addAttribute(`menu-item-wrapper ${isDeep ? "is-deep" : "not-deep"}`, "class")}>
              <a${addAttribute(item.href || "#", "href")}${addAttribute(`menu-item ${pathname.startsWith(item.href || "nothing") ? "menu-item-active" : ""}`, "class")}>
                <span>${item.name}</span>
              </a>
              ${item.items && item.items?.length > 0 ? renderTemplate`<div class="menu-item-subitems">
                  <div class="menu-item-subitems-inner">
                    ${item.items.map((subItem) => renderTemplate`<div class="menu-subitem is-bold">
                        <a${addAttribute(subItem.href || "#", "href")}>
                          <span>${subItem.name}</span>
                        </a>
                        ${subItem.items && subItem.items?.length > 0 ? renderTemplate`<div class="menu-subitem-items">
                            ${subItem.items.map((subSubItem) => renderTemplate`<div>
                                <a${addAttribute(subSubItem.href || "#", "href")}>
                                  <span>${subSubItem.name}</span>
                                </a>
                              </div>`)}
                          </div>` : null}
                      </div>`)}
                  </div>
                </div>` : null}
            </div>`;
  })}
      </nav>
    </div>
  </div>
</header>`;
});

const $$file$3 = "C:/Users/Andrei/Sites/astro-solid-shop/src/components/Header/Header.astro";
const $$url$3 = undefined;

const $$module2$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$3,
	default: $$Header,
	file: $$file$3,
	url: $$url$3
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$2 = createMetadata("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/src/layouts/MainLayout.astro", { modules: [{ module: $$module1$6, specifier: "~/components/MainHead.astro", assert: {} }, { module: $$module2$2, specifier: "~/components/Header/Header.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$7 = createAstro("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/src/layouts/MainLayout.astro", "", "file:///C:/Users/Andrei/Sites/astro-solid-shop/");
const $$MainLayout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$7, $$props, $$slots);
  Astro2.self = $$MainLayout;
  const { head } = Astro2.props;
  return renderTemplate`<html${addAttribute("en", "lang")}>
  <head>
    ${renderComponent($$result, "MainHead", $$MainHead, { "title": head.title, "description": head.description })}
  ${renderHead($$result)}</head>
  <body>
    ${renderComponent($$result, "Header", $$Header, {})}
    ${renderSlot($$result, $$slots["default"])}
  </body></html>`;
});

const $$file$2 = "C:/Users/Andrei/Sites/astro-solid-shop/src/layouts/MainLayout.astro";
const $$url$2 = undefined;

const $$module1$4 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$2,
	default: $$MainLayout,
	file: $$file$2,
	url: $$url$2
}, Symbol.toStringTag, { value: 'Module' }));

// To strip off params when checking for file on disk.
const paramPattern = /\?.*/;

/**
 * getSrcPath allows the use of `src` attributes relative to either the public folder or project root.
 *
 * It first checks to see if the src is a file relative to the project root.
 * If the file isn't found, it will look in the public folder.
 * Finally, if it still can't be found, the original input will be returned.
 */
async function getSrcPath(src) {
  const { default: astroViteConfigs } = await import(
    './chunks/astroViteConfigs.e6e35cf0.mjs'
  );

  // If this is already resolved to a file, return it.
  if (fs.existsSync(src.replace(paramPattern, ""))) return src;

  const rootPath = path.join(astroViteConfigs.rootDir, src);
  const rootTest = rootPath.replace(paramPattern, "");
  if (fs.existsSync(rootTest)) return rootPath;

  const publicPath = path.join(astroViteConfigs.publicDir, src);
  const publicTest = publicPath.replace(paramPattern, "");
  if (fs.existsSync(publicTest)) return publicPath;

  // Fallback
  return src;
}

// @ts-check

async function getSrcset(src, breakpoints, format, options) {
  options = {
    format,
    w: breakpoints,
    ...options,
  };

  const keys = Object.keys(options);

  const params = keys.length
    ? keys
        .map((key) =>
          Array.isArray(options[key])
            ? `&${key}=${options[key].join(";")}`
            : `&${key}=${options[key]}`
        )
        .join("")
    : "";

  const id = `${src}?${params.slice(1)}`;

  if (process.env.npm_lifecycle_event !== "dev") {
    const fullPath = await getSrcPath(id);

    const { default: load } = await import('./chunks/load.efa72cdb.mjs');

    const srcset = (await load(fullPath)).slice(16).slice(0, -1);

    return srcset;
  }

  const srcset = (await import(id)).default;

  return srcset;
}

// @ts-check

const colours = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
  },

  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
  },
};

function printWarning({
  key = "",
  type = "",
  message = "",
  element = "",
}) {
  const flag =
    colours.bright + colours.fg.cyan + "[astro-imagetools]" + colours.reset;

  const keyLog = key
    ? " " + colours.bg.yellow + ` ${key} ` + colours.reset
    : "";

  const messageLog =
    colours.fg.yellow +
    (message ||
      (!element
        ? `is not a valid ${type} Config Option`
        : `can't be defined inside attributes.${element}`)) +
    colours.reset;

  console.log(flag + keyLog, messageLog);
}

// @ts-check

function getBreakpoints(breakpoints, imageWidth) {
  if (Array.isArray(breakpoints)) {
    return breakpoints.sort((a, b) => a - b);
  }

  const { count, minWidth = 320 } = breakpoints || {};

  const maxWidth = (() => {
    if (breakpoints?.maxWidth) return breakpoints.maxWidth;

    if (imageWidth > 3840) {
      printWarning({
        message:
          "The width of the source image is greater than 3840px. The generated breakpoints will be capped at 3840px. If you need breakpoints larger than this, please pass the maxWidth option to the breakpoints property.",
      });

      return 3840;
    }

    return imageWidth;
  })();

  const breakPoints = [];

  const diff = maxWidth - minWidth;

  const n =
    count ||
    (maxWidth <= 400
      ? 1
      : maxWidth <= 640
      ? 2
      : maxWidth <= 800
      ? 3
      : maxWidth <= 1024
      ? 4
      : maxWidth <= 1280
      ? 5
      : maxWidth <= 1440
      ? 6
      : maxWidth <= 1920
      ? 7
      : maxWidth <= 2560
      ? 8
      : maxWidth <= 2880
      ? 9
      : maxWidth <= 3840
      ? 10
      : 11);

  let currentWidth = minWidth;

  n > 1 && breakPoints.push(currentWidth);

  let steps = 0;

  for (let i = 1; i < n; i++) {
    steps += i;
  }

  const pixelsPerStep = diff / steps;

  for (let i = 1; i < n - 1; i++) {
    const next = pixelsPerStep * (n - i) + currentWidth;

    breakPoints.push(Math.round(next));

    currentWidth = next;
  }

  breakPoints.push(maxWidth);

  return [...new Set(breakPoints)];
}

// @ts-check

function getConfigOptions(
  imageWidth,
  imagesizes,
  breakpoints,
  format,
  imageFormat,
  fallbackFormat,
  includeSourceFormat
) {
  const formats = [
    ...new Set(
      [format, includeSourceFormat && imageFormat]
        .flat()
        .filter((f) => f && f !== fallbackFormat)
    ),
    fallbackFormat,
  ];

  const requiredBreakpoints = getBreakpoints(breakpoints, imageWidth);

  imagesizes =
    typeof imagesizes === "string"
      ? imagesizes
      : imagesizes(requiredBreakpoints);

  return {
    formats,
    imagesizes,
    requiredBreakpoints,
  };
}

// @ts-check

function filterConfigs(
  type,
  configs,
  supportedConfigs,
  { warn = true } = {}
) {
  const clonedConfigs = { ...configs };

  const requiredConfigs = [];

  type !== "Global" && requiredConfigs.push("src");

  ["Img", "Picture"].includes(type) && requiredConfigs.push("alt");

  requiredConfigs.forEach((key) => {
    if (typeof clonedConfigs[key] === "undefined") {
      throw new Error(`The "${key}" property is required by ${type}`);
    }
  });

  Object.keys(clonedConfigs).forEach((key) => {
    if (!supportedConfigs.includes(key)) {
      if (warn) {
        if (key !== "class") {
          printWarning({ key, type });
        } else if (!onlyAstroClass(clonedConfigs[key])) {
          printWarning({
            message: `Do not provide a "class" directly to ${type}.  Instead, use attributes: https://astro-imagetools-docs.vercel.app/en/components/${type}#attributes`,
          });
        }
      }

      delete clonedConfigs[key];
    }
  });

  return clonedConfigs;
}

/**
 * Checks if the `class` attribute string is only an astro-generated scoped style class.
 */
function onlyAstroClass(classAttr) {
  const astroClassPattern = /^astro-[0-9A-Z]{8}$/;
  return astroClassPattern.test(classAttr);
}

// @ts-check

// Sharp related checks
const sharp = await (async () => {
  try {
    if (await import('sharp')) {
      return true;
    }
  } catch (error) {
    return false;
  }
})();

const supportedImageTypes = [
  "avif",
  "jpeg",
  "jpg",
  "png",
  "webp",
  ...(sharp ? ["heic", "heif", "tiff", "gif"] : ["jxl", "wp2"]),
];

// prettier-ignore
const supportedConfigs = [
  "src", "alt", "tag", "content", "sizes", "preload", "loading", "decoding", "attributes",
  "layout", "placeholder", "breakpoints", "objectFit", "objectPosition", "backgroundSize",
  "backgroundPosition", "format", "fallbackFormat", "includeSourceFormat", "formatOptions",
  "fadeInTransition", "artDirectives", "flip", "flop", "invert", "flatten", "normalize",
  "grayscale", "hue", "saturation", "brightness", "w", "h", "ar", "width", "height", "aspect",
  "background", "tint", "blur", "median", "rotate", "quality", "fit", "kernel", "position",
  "cacheDir"
];

const configFile = await findUp([
  "astro-imagetools.config.js",
  "astro-imagetools.config.mjs",
]);

const configFunction = configFile ? await import(configFile) : null;

const rawGlobalConfigOptions = configFunction?.default ?? {};

const NonGlobalConfigOptions = ["src", "alt", "content"];

const GlobalConfigs = supportedConfigs.filter(
  (key) => !NonGlobalConfigOptions.includes(key)
);

const GlobalConfigOptions = filterConfigs(
  "Global",
  rawGlobalConfigOptions,
  GlobalConfigs
);

// CWD
const cwd = process.cwd().split(path.sep).join(path.posix.sep);

const { cacheDir } = GlobalConfigOptions;

// FS Cache related checks
const fsCachePath =
  (cacheDir
    ? cwd + cacheDir
    : findCacheDir({
        name: "astro-imagetools",
      })) + "/";

fs.existsSync(fsCachePath) || fs.mkdirSync(fsCachePath, { recursive: true });

// @ts-check

async function getFallbackImage(
  src,
  placeholder,
  image,
  format,
  formatOptions,
  rest
) {
  switch (placeholder) {
    case "blurred": {
      const dataUri = await getSrcset(src, [20], format, {
        inline: true,
        ...rest,
        ...formatOptions[format],
      });

      return dataUri;
    }
    case "tracedSVG": {
      const { function: fn, options } = formatOptions.tracedSVG;

      const traceSVG = util.promisify(potrace[fn]);

      const imageBuffer = sharp
        ? await image.toBuffer()
        : Buffer.from(
            (await image.encode(`image/${format === "jpg" ? "jpeg" : format}`))
              .data
          );

      const tracedSVG = await traceSVG(imageBuffer, options);

      return `data:image/svg+xml;utf8,${tracedSVG}`;
    }
    case "dominantColor": {
      if (sharp) {
        var { r, g, b } = (await image.stats()).dominant;
      } else {
        [r, g, b] = image.color;
      }

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" style="background: rgb(${r},${g},${b})"></svg>`;

      return `data:image/svg+xml;utf8,${svg}`;
    }
    default:
      return null;
  }
}

// @ts-check

async function getImageSources(
  src,
  image,
  format,
  imageWidth,
  imagesizes,
  breakpoints,
  placeholder,
  imageFormat,
  formatOptions,
  fallbackFormat,
  includeSourceFormat,
  rest
) {
  const calculatedConfigs = getConfigOptions(
    imageWidth,
    imagesizes,
    breakpoints,
    format,
    imageFormat,
    fallbackFormat,
    includeSourceFormat
  );

  const { formats, requiredBreakpoints } = calculatedConfigs;

  imagesizes = calculatedConfigs.imagesizes;

  const maxWidth = requiredBreakpoints[requiredBreakpoints.length - 1];
  const sliceLength = -(maxWidth.toString().length + 2);

  const sources = await Promise.all(
    formats.map(async (format) => {
      const srcset = await getSrcset(src, requiredBreakpoints, format, {
        ...rest,
        ...formatOptions[format],
      });

      const srcsets = srcset.split(", ");
      const srcObject =
        format === fallbackFormat
          ? { src: srcsets[srcsets.length - 1].slice(0, sliceLength) }
          : {};

      return {
        ...srcObject,
        format,
        srcset,
      };
    })
  );

  const sizes = {
    width: maxWidth,
    height: Math.round(maxWidth / rest.aspect),
  };

  const fallback = await getFallbackImage(
    src,
    placeholder,
    image,
    fallbackFormat,
    formatOptions,
    rest
  );

  return { sources, sizes, fallback, imagesizes };
}

// @ts-check

const { getImageDetails } = await (sharp
  ? import('./chunks/imagetools.7d71676c.mjs')
  : import('./chunks/codecs.95d7f143.mjs'));

// @ts-ignore
const { fileTypeFromBuffer } = await import('file-type');

const throwErrorIfUnsupported = (src, ext) => {
  if (!ext && typeof ext !== "string") {
    throw new Error(`Failed to load ${src}; Invalid image format`);
  }

  if (ext && !supportedImageTypes.includes(ext.toLowerCase())) {
    throw new Error(
      `Failed to load ${src}; Invalid image format ${ext} or the format is not supported by astro-imagetools`
    );
  }
};

const getProcessedImage = async (src, transformConfigs) => {
  throwErrorIfUnsupported(src, extname(src).slice(1));

  if (src.match("(http://|https://|data:image/).*")) {
    const filename = src.startsWith("data:") ? "" : basename(src);

    const hash = crypto.createHash("md5").update(src).digest("hex");

    let filepath = `${fsCachePath}${filename}.${hash}`;

    const fileExists = (() => {
      for (const type of supportedImageTypes) {
        const fileExists = fs.existsSync(filepath + `.${type}`);

        if (fileExists) {
          filepath += `.${type}`;

          return true;
        }
      }
    })();

    if (!fileExists) {
      const buffer = Buffer.from(await (await fetch(src)).arrayBuffer());

      const { ext } = (await fileTypeFromBuffer(buffer)) || {};

      throwErrorIfUnsupported(src, ext);

      filepath += `.${ext}`;

      fs.writeFileSync(filepath, buffer);
    }

    src = join("/", relative(cwd, filepath));
  } else {
    const { default: astroViteConfigs } = await import(
      './chunks/astroViteConfigs.e6e35cf0.mjs'
    );

    const { isSsrBuild } = astroViteConfigs;

    if (isSsrBuild) {
      const filename = fileURLToPath(import.meta.url);

      const assetPath = resolve(filename, "../../client") + src;

      src = "/" + relative(cwd, assetPath);
    }
  }

  const {
    w,
    h,
    ar,
    width = w,
    height = h,
    aspect = ar,
    ...rest
  } = transformConfigs;

  const path = src.replace(/\\/g, `/`);

  const { image, imageWidth, imageHeight, imageFormat } = await getImageDetails(
    await getSrcPath(src),
    width,
    height,
    aspect
  );

  return {
    path,
    rest,
    image,
    imageWidth,
    imageHeight,
    imageFormat,
  };
};

// @ts-check

async function getArtDirectedImages(
  artDirectives = [],
  placeholder,
  format,
  imagesizes,
  breakpoints,
  fallbackFormat,
  includeSourceFormat,
  formatOptions,
  rest
) {
  const images = await Promise.all(
    artDirectives.map(
      async ({
        src,
        media,
        sizes: directiveImagesizes,
        placeholder: directivePlaceholder,
        breakpoints: directiveBreakpoints,
        objectFit,
        objectPosition,
        backgroundSize,
        backgroundPosition,
        format: directiveFormat,
        fallbackFormat: directiveFallbackFormat,
        includeSourceFormat: directiveIncludeSourceFormat,
        formatOptions: directiveFormatOptions = {},
        ...configOptions
      }) => {
        const {
          path,
          rest: rest2,
          image,
          imageWidth,
          imageHeight,
          imageFormat,
        } = await getProcessedImage(src, configOptions);

        rest2.aspect = `${imageWidth / imageHeight}`;

        const calculatedConfigs = getConfigOptions(
          imageWidth,
          directiveImagesizes || imagesizes,
          directiveBreakpoints || breakpoints,
          directiveFormat || format,
          imageFormat,
          directiveFallbackFormat || fallbackFormat,
          directiveIncludeSourceFormat || includeSourceFormat
        );

        const { formats, requiredBreakpoints } = calculatedConfigs;

        imagesizes = calculatedConfigs.imagesizes;

        const maxWidth = requiredBreakpoints[requiredBreakpoints.length - 1];

        const sources = await Promise.all(
          formats.map(async (format) => {
            const srcset = await getSrcset(path, requiredBreakpoints, format, {
              ...rest,
              ...rest2,
              ...formatOptions[format],
              ...directiveFormatOptions[format],
            });

            return {
              format,
              srcset,
            };
          })
        );

        const sizes = {
          width: maxWidth,
          height: Math.round(maxWidth / rest2.aspect),
        };

        const object = {
          fit: objectFit,
          position: objectPosition,
        };

        const fallback = await getFallbackImage(
          path,
          directivePlaceholder || placeholder,
          image,
          imageFormat,
          { ...formatOptions, ...directiveFormatOptions },
          { ...rest, ...rest2 }
        );

        return {
          media,
          sources,
          sizes,
          object,
          fallback,
          imagesizes,
        };
      }
    )
  );

  return images;
}

// @ts-check

const imagesData = new Map();

async function getImage ({
  src,
  type,
  sizes: imagesizes,
  format,
  breakpoints,
  placeholder,
  fallbackFormat,
  includeSourceFormat,
  formatOptions,
  artDirectives,
  transformConfigs,
}) {
  const args = Array.from(arguments);

  const hash = objectHash(args);

  if (imagesData.has(hash)) {
    return imagesData.get(hash);
  }

  const start = performance.now();

  const { path, rest, image, imageWidth, imageHeight, imageFormat } =
    await getProcessedImage(src, transformConfigs);

  src = path;

  rest.aspect = `${imageWidth / imageHeight}`;

  if (!fallbackFormat) {
    fallbackFormat = imageFormat;
  }

  const [mainImage, artDirectedImages] = await Promise.all([
    getImageSources(
      src,
      image,
      format,
      imageWidth,
      imagesizes,
      breakpoints,
      placeholder,
      imageFormat,
      formatOptions,
      fallbackFormat,
      includeSourceFormat,
      rest
    ),
    getArtDirectedImages(
      artDirectives,
      placeholder,
      format,
      imagesizes,
      breakpoints,
      fallbackFormat,
      includeSourceFormat,
      formatOptions,
      rest
    ),
  ]);

  const images = [...artDirectedImages, mainImage];

  const uuid = crypto.randomBytes(4).toString("hex").toUpperCase();

  const returnObject = {
    uuid,
    images,
  };

  imagesData.set(hash, returnObject);

  const end = performance.now();

  console.log(
    `Responsive Image sets generated for ${type} at ${args[0].src} in ${
      end - start
    }ms`
  );

  return returnObject;
}

// @ts-check

function getAttributesString({
  attributes,
  element = "",
  excludeArray = [],
}) {
  const attributesString = Object.keys(attributes)
    .filter((key) => {
      if (excludeArray.includes(key)) {
        printWarning({
          key,
          element,
        });

        return false;
      }

      return true;
    })
    .map((key) => `${key}="${attributes[key]}"`)
    .join(" ");

  return attributesString;
}

// @ts-check

function getImgElement({
  src,
  alt,
  sizes,
  style,
  srcset,
  loading,
  decoding,
  imagesizes,
  fadeInTransition,
  layoutStyles,
  imgAttributes,
  imgClassName = "",
}) {
  const {
    class: customClasses = "",
    style: customInlineStyles = "",
    onload: customOnload = "",
    ...restImgAttributes
  } = imgAttributes;

  const attributesString = getAttributesString({
    attributes: restImgAttributes,
    element: "img",
    excludeArray: [
      "src",
      "alt",
      "srcset",
      "sizes",
      "width",
      "height",
      "loading",
      "decoding",
    ],
  });

  const classAttribute = ["astro-imagetools-img", imgClassName, customClasses]
    .join(" ")
    .trim();

  const styleAttribute = [
    "display: inline-block; overflow: hidden; vertical-align: middle;",
    customInlineStyles + (customInlineStyles.endsWith(";") ? "" : ";"),
    layoutStyles,
  ]
    .join(" ")
    .trim();

  const onloadAttribute = [
    !imgClassName && style && fadeInTransition
      ? `parentElement.style.setProperty('--z-index', 1);parentElement.style.setProperty('--opacity', 0);`
      : "",
    customOnload,
  ]
    .join(" ")
    .trim();

  const imgElement = `<img
    ${attributesString}
    src="${src}"
    ${typeof alt === "string" ? `alt="${alt}"` : ""}
    srcset="${srcset}"
    sizes="${imagesizes}"
    width="${sizes.width}"
    height="${sizes.height}"
    ${loading ? `loading="${loading}"` : ""}
    ${decoding ? `decoding="${decoding}"` : ""}
    class="${classAttribute}"
    style="${styleAttribute}"
    onload="${onloadAttribute}"
  />`;

  return imgElement;
}

// @ts-check

function getLinkElement({
  images = [],
  preload = "",
  imagesizes = "",
  linkAttributes,
}) {
  const imagesrcset =
    preload &&
    images[images.length - 1]?.sources.find(
      ({ format: fmt }) => fmt === preload
    )?.srcset;

  const attributesString = getAttributesString({
    element: "link",
    attributes: linkAttributes,
    excludeArray: ["as", "rel", "imagesizes", "imagesrcset"],
  });

  const linkElement =
    preload && images.length
      ? `<link
        ${attributesString}
        as="image"
        rel="preload"
        imagesizes="${imagesizes}"
        imagesrcset="${imagesrcset}"
      />`
      : "";

  return linkElement;
}

// @ts-check

function getStyleElement({
  styleAttributes,
  backgroundStyles = "",
}) {
  const attributesString = getAttributesString({
    attributes: styleAttributes,
  });

  const styleElement = `<style ${attributesString}>${backgroundStyles}</style>`;

  return styleElement;
}

// @ts-check

function getLayoutStyles({
  layout = null,
  isBackgroundImage = false,
}) {
  return isBackgroundImage
    ? "width: 100%; height: 100%;"
    : layout === "fill"
    ? `width: 100%; height: 100%;`
    : layout === "fullWidth"
    ? `width: 100%; height: auto;`
    : layout === "fixed"
    ? ""
    : "max-width: 100%; height: auto;";
}

// @ts-check

const NonProperties = {
  Img: [
    "tag",
    "content",
    "backgroundSize",
    "backgroundPosition",
    "fallbackFormat",
    "includeSourceFormat",
    "fadeInTransition",
    "artDirectives",
    "cacheDir",
  ],
  Picture: [
    "tag",
    "content",
    "backgroundSize",
    "backgroundPosition",
    "cacheDir",
  ],
  BackgroundImage: [
    "alt",
    "loading",
    "decoding",
    "layout",
    "objectFit",
    "objectPosition",
    "fadeInTransition",
    "cacheDir",
  ],
  BackgroundPicture: [
    "alt",
    "backgroundSize",
    "backgroundPosition",
    "cacheDir",
  ],
};

const ImgProperties = supportedConfigs.filter(
    (key) => !NonProperties.Img.includes(key)
  ),
  PictureProperties = supportedConfigs.filter(
    (key) => !NonProperties.Picture.includes(key)
  ),
  BackgroundImageProperties = supportedConfigs.filter(
    (key) => !NonProperties.BackgroundImage.includes(key)
  ),
  BackgroundPictureProperties = supportedConfigs.filter(
    (key) => !NonProperties.BackgroundPicture.includes(key)
  );

const SupportedProperties = {
  Img: ImgProperties,
  Picture: PictureProperties,
  BackgroundImage: BackgroundImageProperties,
  BackgroundPicture: BackgroundPictureProperties,
};

function getFilteredProps(type, props) {
  const filteredGlobalConfigs = filterConfigs(
    "Global",
    GlobalConfigOptions,
    SupportedProperties[type],
    { warn: false }
  );

  const { search, searchParams } = new URL(props.src, "file://");

  props.src = props.src.replace(search, "");

  const paramOptions = Object.fromEntries(searchParams);

  const filteredLocalProps = filterConfigs(
    type,
    {
      ...paramOptions,
      ...props,
    },
    SupportedProperties[type]
  );

  const resolvedProps = {
    ...filteredGlobalConfigs,
    ...filteredLocalProps,
  };

  const {
    src,
    alt,
    tag = "section",
    content = "",
    sizes = function (breakpoints) {
      const maxWidth = breakpoints[breakpoints.length - 1];
      return `(min-width: ${maxWidth}px) ${maxWidth}px, 100vw`;
    },
    preload,
    loading = preload ? "eager" : "lazy",
    decoding = "async",
    attributes = {},
    layout = "constrained",
    placeholder = "blurred",
    breakpoints,
    objectFit = "cover",
    objectPosition = "50% 50%",
    backgroundSize = "cover",
    backgroundPosition = "50% 50%",
    format = type === "Img" ? undefined : ["avif", "webp"],
    fallbackFormat,
    includeSourceFormat = true,
    formatOptions = {
      tracedSVG: {
        function: "trace",
      },
    },
    fadeInTransition = true,
    artDirectives,
    ...transformConfigs
  } = resolvedProps;

  // prettier-ignore
  const allProps = {
    src, alt, tag, content, sizes, preload, loading, decoding, attributes, layout, placeholder,
    breakpoints, objectFit, objectPosition, backgroundSize, backgroundPosition, format,
    fallbackFormat, includeSourceFormat, formatOptions, fadeInTransition, artDirectives,
    ...transformConfigs,
  };

  const filteredProps = filterConfigs(
    type,
    allProps,
    SupportedProperties[type],
    { warn: false }
  );

  return {
    filteredProps,
    transformConfigs,
  };
}

// @ts-check

function getBackgroundStyles(
  images,
  className,
  objectFit,
  objectPosition,
  fadeInTransition,
  { isBackgroundPicture = false } = {}
) {
  const sourcesWithFallback = images.filter(({ fallback }) => fallback);

  if (sourcesWithFallback.length === 0) return "";

  const staticStyles = !fadeInTransition
    ? ""
    : `
    ${
      isBackgroundPicture
        ? `
            .astro-imagetools-background-picture * {
              z-index: 1;
              position: relative;
            }
          `
        : ""
    }

    .${className} {
      --opacity: 1;
      --z-index: 0;
    }

    ${
      !isBackgroundPicture
        ? `
            .${className} img {
              z-index: 1;
              position: relative;
            }
          `
        : ""
    }

    .${className}::after {
      inset: 0;
      content: "";
      left: 0;
      width: 100%;
      height: 100%;
      position: absolute;
      transition: opacity ${
        typeof fadeInTransition !== "object"
          ? "1s"
          : (() => {
              const {
                delay = "0s",
                duration = "1s",
                timingFunction = "ease",
              } = fadeInTransition;

              return `${duration} ${timingFunction} ${delay}`;
            })()
      };
      opacity: var(--opacity);
      z-index: var(--z-index);
    }
  `;

  const dynamicStyles = images
    .map(({ media, fallback, object }) => {
      const elementSelector = className + (fadeInTransition ? " img" : ""),
        backgroundElementSelector =
          className + (fadeInTransition ? "::after" : "");

      const style = `
        .${elementSelector} {
          object-fit: ${object?.fit || objectFit};
          object-position: ${object?.position || objectPosition};
        }

        .${backgroundElementSelector} {
          background-size: ${object?.fit || objectFit};
          background-image: url("${encodeURI(fallback)}");
          background-position: ${object?.position || objectPosition};
        }
      `;

      return media ? `@media ${media} { ${style} }` : style;
    })
    .reverse();

  const backgroundStyles = [staticStyles, ...dynamicStyles].join("");

  return backgroundStyles;
}

// @ts-check

async function renderImg(props) {
  const type = "Img";

  const { filteredProps, transformConfigs } = getFilteredProps(type, props);

  const {
    src,
    alt,
    sizes,
    preload,
    loading,
    decoding,
    attributes,
    layout,
    breakpoints,
    placeholder,
    objectFit,
    objectPosition,
    format,
    formatOptions,
  } = filteredProps;

  const artDirectives = [],
    fallbackFormat = format,
    fadeInTransition = false,
    includeSourceFormat = false;

  const {
    img: imgAttributes = {},
    link: linkAttributes = {},
    style: styleAttributes = {},
  } = attributes;

  const { uuid, images } = await getImage({
    src,
    type,
    sizes,
    format,
    breakpoints,
    placeholder,
    artDirectives,
    fallbackFormat,
    includeSourceFormat,
    formatOptions,
    transformConfigs,
  });

  const className = `astro-imagetools-img-${uuid}`;

  const { imagesizes } = images[images.length - 1];

  const backgroundStyles = getBackgroundStyles(
    images,
    className,
    objectFit,
    objectPosition,
    fadeInTransition
  );

  const style = getStyleElement({ styleAttributes, backgroundStyles });

  const link = getLinkElement({ images, preload, imagesizes, linkAttributes });

  const layoutStyles = getLayoutStyles({ layout });

  const sources = images.flatMap(({ sources, sizes, imagesizes }) =>
    sources.map(({ src, srcset }) =>
      getImgElement({
        src,
        alt,
        sizes,
        style,
        srcset,
        loading,
        decoding,
        imagesizes,
        fadeInTransition,
        layoutStyles,
        imgAttributes,
        imgClassName: className,
      })
    )
  );

  const [img] = sources;

  return { link, style, img };
}

const $$module1$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: renderImg
}, Symbol.toStringTag, { value: 'Module' }));

createMetadata("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/node_modules/astro-imagetools/components/Img.astro", { modules: [{ module: $$module1$3, specifier: "../api/renderImg.js", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$6 = createAstro("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/node_modules/astro-imagetools/components/Img.astro", "", "file:///C:/Users/Andrei/Sites/astro-solid-shop/");
const $$Img = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$6, $$props, $$slots);
  Astro2.self = $$Img;
  const { link, style, img } = await renderImg(Astro2.props);
  return renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": () => renderTemplate`${markHTMLString(link + style + img)}` })}
`;
});

// @ts-check

function getPictureElement({
  sources,
  className,
  layoutStyles,
  pictureAttributes,
  isBackgroundPicture = false,
}) {
  const {
    class: customClasses = "",
    style: customInlineStyles = "",
    ...restPictureAttributes
  } = pictureAttributes;

  const attributesString = getAttributesString({
    attributes: restPictureAttributes,
  });

  const classAttribute = ["astro-imagetools-picture", className, customClasses]
    .join(" ")
    .trim();

  const styleAttribute = [
    isBackgroundPicture
      ? `position: absolute; z-index: 0; width: 100%; height: 100%; display: inline-block;`
      : `position: relative; display: inline-block;`,
    customInlineStyles + (customInlineStyles.endsWith(";") ? "" : ";"),
    layoutStyles,
  ]
    .join(" ")
    .trim();

  const pictureElement = `<picture
    ${attributesString}
    class="${classAttribute}"
    style="${styleAttribute}"
    >${sources.join("\n")}
  </picture>`;

  return pictureElement;
}

// @ts-check

async function renderPicture(props) {
  const type = "Picture";

  const { filteredProps, transformConfigs } = getFilteredProps(type, props);

  const {
    src,
    alt,
    sizes,
    preload,
    loading,
    decoding,
    attributes,
    layout,
    placeholder,
    breakpoints,
    objectFit,
    objectPosition,
    format,
    fallbackFormat,
    includeSourceFormat,
    formatOptions,
    fadeInTransition,
    artDirectives,
  } = filteredProps;

  const {
    img: imgAttributes = {},
    link: linkAttributes = {},
    style: styleAttributes = {},
    picture: pictureAttributes = {},
  } = attributes;

  const { uuid, images } = await getImage({
    src,
    type,
    sizes,
    format,
    breakpoints,
    placeholder,
    fallbackFormat,
    includeSourceFormat,
    formatOptions,
    artDirectives,
    transformConfigs,
  });

  const className = `astro-imagetools-picture-${uuid}`;

  const { imagesizes } = images[images.length - 1];

  const backgroundStyles = getBackgroundStyles(
    images,
    className,
    objectFit,
    objectPosition,
    fadeInTransition
  );

  const style = getStyleElement({ styleAttributes, backgroundStyles });

  const link = getLinkElement({ images, preload, imagesizes, linkAttributes });

  const layoutStyles = getLayoutStyles({ layout });

  const sources = images.flatMap(({ media, sources, sizes, imagesizes }) =>
    sources.map(({ format, src, srcset }) =>
      src
        ? getImgElement({
            src,
            alt,
            sizes,
            style,
            srcset,
            loading,
            decoding,
            imagesizes,
            fadeInTransition,
            layoutStyles,
            imgAttributes,
          })
        : `<source
            srcset="${srcset}"
            sizes="${imagesizes}"
            width="${sizes.width}"
            height="${sizes.height}"
            type="${`image/${format}`}"
            ${media ? `media="${media}"` : ""}
          />`
    )
  );

  const picture = getPictureElement({
    sources,
    className,
    layoutStyles,
    pictureAttributes,
  });

  return { link, style, picture };
}

const $$module1$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: renderPicture
}, Symbol.toStringTag, { value: 'Module' }));

createMetadata("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/node_modules/astro-imagetools/components/Picture.astro", { modules: [{ module: $$module1$2, specifier: "../api/renderPicture.js", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$5 = createAstro("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/node_modules/astro-imagetools/components/Picture.astro", "", "file:///C:/Users/Andrei/Sites/astro-solid-shop/");
const $$Picture = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$5, $$props, $$slots);
  Astro2.self = $$Picture;
  const { link, style, picture } = await renderPicture(Astro2.props);
  return renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": () => renderTemplate`${markHTMLString(link + style + picture)}` })}
`;
});

// @ts-check

function getContainerElement({
  tag,
  content,
  className = "",
  containerAttributes,
  isBackgroundPicture = false,
}) {
  const {
    class: customClasses = "",
    style: customInlineStyles = "",
    ...restContainerAttributes
  } = containerAttributes;

  const attributesString = getAttributesString({
    attributes: restContainerAttributes,
  });

  const classAttribute = [
    isBackgroundPicture
      ? "astro-imagetools-background-picture"
      : "astro-imagetools-background-image",
    isBackgroundPicture ? "" : className,
    customClasses,
  ]
    .join(" ")
    .trim();

  const styleAttribute = [
    isBackgroundPicture ? "position: relative;" : "",
    customInlineStyles + (customInlineStyles.endsWith(";") ? "" : ";"),
  ]
    .join(" ")
    .trim();

  const containerElement = `<${tag}
    ${attributesString}
    class="${classAttribute}"
    style="${styleAttribute}"
  >
    ${content}
  </${tag}>`;

  return containerElement;
}

// @ts-check

async function renderBackgroundImage(props) {
  const type = "BackgroundImage";

  const { filteredProps, transformConfigs } = getFilteredProps(type, props);

  const {
    src,
    tag,
    content,
    preload,
    attributes,
    placeholder,
    breakpoints,
    backgroundSize,
    backgroundPosition,
    format,
    fallbackFormat,
    includeSourceFormat,
    formatOptions,
    artDirectives,
  } = filteredProps;

  const {
    link: linkAttributes = {},
    style: styleAttributes = {},
    container: containerAttributes = {},
  } = attributes;

  const sizes = "";

  const { uuid, images } = await getImage({
    src,
    type,
    sizes,
    format,
    breakpoints,
    placeholder,
    artDirectives,
    fallbackFormat,
    includeSourceFormat,
    formatOptions,
    transformConfigs,
  });

  const className = `astro-imagetools-background-image-${uuid}`;

  const { imagesizes } = images[images.length - 1];

  const link = getLinkElement({ images, preload, imagesizes, linkAttributes });

  const backgroundImageStylesArray = images.map(({ media, sources }) => {
    const uuid = crypto.randomBytes(4).toString("hex").toUpperCase();

    const fallbackUrlCustomVariable = `--astro-imagetools-background-image-fallback-url${uuid}`;

    const newSources = {};

    sources.forEach(({ src, format, srcset }) => {
      const sources = srcset
        .split(", ")
        .map((source) => [
          source.slice(0, source.lastIndexOf(" ")),
          source.slice(source.lastIndexOf(" ") + 1, -1),
        ]);

      sources.forEach(([path, width]) => {
        if (!newSources[width]) {
          newSources[width] = [];
        }

        newSources[width].push({ src, format, path });
      });
    });

    const widths = Object.keys(newSources)
      .map((width) => parseInt(width))
      .reverse();

    const maxWidth = Math.max(...widths);

    const styles = widths
      .map((width) => {
        const sources = newSources[width];

        const styles = sources
          .map(
            ({ format, path }, i) =>
              `
                ${i !== sources.length - 1 ? `.${format} ` : ""}.${className} {
                  background-repeat: no-repeat;
                  background-image: url(${path}),
                    var(${fallbackUrlCustomVariable});
                  background-size: ${backgroundSize};
                  background-position: ${backgroundPosition};
                }
              `
          )
          .reverse()
          .join("");

        return width === maxWidth
          ? styles
          : `
              @media screen and (max-width: ${width}px) {
                ${styles}
              }
            `;
      })
      .join("");

    return {
      fallbackUrlCustomVariable,
      styles: media
        ? `
              @media ${media} {
                ${styles}
              }
            `
        : styles,
    };
  });

  const containerStyles = `
    .${className} {
      position: relative;
      ${images
        .map(({ fallback }, i) => {
          const fallbackUrlCustomVariable =
            backgroundImageStylesArray[i].fallbackUrlCustomVariable;

          return `${fallbackUrlCustomVariable}: url("${encodeURI(fallback)}");`;
        })
        .join("\n")}
    }
  `;

  const backgroundStyles =
    backgroundImageStylesArray.map(({ styles }) => styles).join("\n") +
    containerStyles;

  const style = getStyleElement({ styleAttributes, backgroundStyles });

  const htmlElement = getContainerElement({
    tag,
    content,
    className,
    containerAttributes,
  });

  return { link, style, htmlElement };
}

const $$module1$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: renderBackgroundImage
}, Symbol.toStringTag, { value: 'Module' }));

createMetadata("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/node_modules/astro-imagetools/components/BackgroundImage.astro", { modules: [{ module: $$module1$1, specifier: "../api/renderBackgroundImage.js", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [{ type: "inline", value: `
  const { classList } = document.documentElement;

  const addClass = classList.add.bind(classList);

  addClass("jpeg");
  addClass("png");

  const isFormatSupported = (format, dataUri) => {
    const image = new Image();

    image.src = \`data:image/\${format};base64,\${dataUri}\`;

    image.onload = addClass(format);
  };

  // TODO: Check support for JXL images
  // isFormatSupported("jxl", "/woAEBAJCAQBACwASxLFgoUJEP3D/wA=");

  isFormatSupported("webp", "UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==");

  isFormatSupported(
    "avif",
    "AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A="
  );
` }] });
const $$Astro$4 = createAstro("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/node_modules/astro-imagetools/components/BackgroundImage.astro", "", "file:///C:/Users/Andrei/Sites/astro-solid-shop/");
const $$BackgroundImage = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$BackgroundImage;
  const content = await Astro2.slots.render("default");
  const { link, style, htmlElement } = await renderBackgroundImage({
    content,
    ...Astro2.props
  });
  return renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": () => renderTemplate`${markHTMLString(link + style + htmlElement)}` })}


`;
});

// @ts-check

async function renderBackgroundPicture(props) {
  const type = "BackgroundPicture";

  const { filteredProps, transformConfigs } = getFilteredProps(type, props);

  const {
    src,
    tag,
    content,
    sizes,
    preload,
    loading,
    decoding,
    attributes,
    placeholder,
    breakpoints,
    objectFit,
    objectPosition,
    format,
    fallbackFormat,
    includeSourceFormat,
    formatOptions,
    fadeInTransition,
    artDirectives,
  } = filteredProps;

  const {
    img: imgAttributes = {},
    link: linkAttributes = {},
    style: styleAttributes = {},
    picture: pictureAttributes = {},
    container: containerAttributes = {},
  } = attributes;

  const { uuid, images } = await getImage({
    src,
    type,
    sizes,
    format,
    breakpoints,
    placeholder,
    artDirectives,
    fallbackFormat,
    includeSourceFormat,
    formatOptions,
    transformConfigs,
  });

  const className = `astro-imagetools-picture-${uuid}`;

  const { imagesizes } = images[images.length - 1];

  const backgroundStyles = getBackgroundStyles(
    images,
    className,
    objectFit,
    objectPosition,
    fadeInTransition,
    { isBackgroundPicture: true }
  );

  const style = getStyleElement({ styleAttributes, backgroundStyles });

  const link = getLinkElement({ images, preload, imagesizes, linkAttributes });

  const layoutStyles = getLayoutStyles({ isBackgroundImage: true });

  // Background Images shouldn't convey important information
  const alt = "";

  const sources = images.flatMap(({ media, sources, sizes, imagesizes }) =>
    sources.map(({ format, src, srcset }) =>
      src
        ? getImgElement({
            src,
            alt,
            sizes,
            style,
            srcset,
            loading,
            decoding,
            imagesizes,
            fadeInTransition,
            layoutStyles,
            imgAttributes,
          })
        : `<source
            srcset="${srcset}"
            sizes="${imagesizes}"
            width="${sizes.width}"
            height="${sizes.height}"
            type="${`image/${format}`}"
            ${media ? `media="${media}"` : ""}
          />`
    )
  );

  const picture = getPictureElement({
    sources,
    className,
    layoutStyles,
    pictureAttributes,
    isBackgroundPicture: true,
  });

  const htmlElement = getContainerElement({
    tag,
    content: picture + content,
    containerAttributes,
    isBackgroundPicture: true,
  });

  return { link, style, htmlElement };
}

const $$module1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: renderBackgroundPicture
}, Symbol.toStringTag, { value: 'Module' }));

const $$module2$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null
}, Symbol.toStringTag, { value: 'Module' }));

createMetadata("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/node_modules/astro-imagetools/components/BackgroundPicture.astro", { modules: [{ module: $$module1, specifier: "../api/renderBackgroundPicture.js", assert: {} }, { module: $$module2$1, specifier: "../types.d", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$3 = createAstro("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/node_modules/astro-imagetools/components/BackgroundPicture.astro", "", "file:///C:/Users/Andrei/Sites/astro-solid-shop/");
const $$BackgroundPicture = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$BackgroundPicture;
  const content = await Astro2.slots.render("default");
  const { link, style, htmlElement } = await renderBackgroundPicture({
    content,
    ...Astro2.props
  });
  return renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": () => renderTemplate`${markHTMLString(link + style + htmlElement)}` })}
`;
});

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
createMetadata("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/node_modules/astro-imagetools/components/ImageSupportDetection.astro", { modules: [], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$2 = createAstro("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/node_modules/astro-imagetools/components/ImageSupportDetection.astro", "", "file:///C:/Users/Andrei/Sites/astro-solid-shop/");
const $$ImageSupportDetection = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$ImageSupportDetection;
  return renderTemplate(_a || (_a = __template(['<!-- prettier-ignore --><script>\nconst{classList:e}=document.documentElement,A=e.add.bind(e);A("jpeg");A("png");const g=(B,d)=>{const a=new Image;a.src=`data:image/${B};base64,${d}`,a.onload=A(B)};g("webp","UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==");g("avif","AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=");\n<\/script>\n'], ['<!-- prettier-ignore --><script>\nconst{classList:e}=document.documentElement,A=e.add.bind(e);A("jpeg");A("png");const g=(B,d)=>{const a=new Image;a.src=\\`data:image/\\${B};base64,\\${d}\\`,a.onload=A(B)};g("webp","UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==");g("avif","AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=");\n<\/script>\n'])));
});

const $$module2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	Img: $$Img,
	Picture: $$Picture,
	BackgroundImage: $$BackgroundImage,
	BackgroundPicture: $$BackgroundPicture,
	ImageSupportDetection: $$ImageSupportDetection
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$1 = createMetadata("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/src/pages/index.astro", { modules: [{ module: $$module1$4, specifier: "~/layouts/MainLayout.astro", assert: {} }, { module: $$module2, specifier: "astro-imagetools/components", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$1 = createAstro("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/src/pages/index.astro", "", "file:///C:/Users/Andrei/Sites/astro-solid-shop/");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Index;
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "head": { title: "Astro Shop" } }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<main class="wrapper mt4 mb4">
    HI
    ${renderComponent($$result, "Img", $$Img, { "src": "https://picsum.photos/1024/768", "alt": "" })}
  </main>` })}`;
});

const $$file$1 = "C:/Users/Andrei/Sites/astro-solid-shop/src/pages/index.astro";
const $$url$1 = "";

const _page0 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata: $$metadata$1,
	default: $$Index,
	file: $$file$1,
	url: $$url$1
}, Symbol.toStringTag, { value: 'Module' }));

async function get$1({ request }) {
  const headers = {
    "Cache-Control": "max-age=0, s-maxage=3600",
    "Content-Type": "application/xml"
  };
  let parsed = new URL(request.url);
  let products = [];
  return {
    headers,
    body: `<?xml version="1.0" encoding="UTF-8" ?>
<urlset
  xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="https://www.google.com/schemas/sitemap-news/0.9"
  xmlns:xhtml="https://www.w3.org/1999/xhtml"
  xmlns:mobile="https://www.google.com/schemas/sitemap-mobile/1.0"
  xmlns:image="https://www.google.com/schemas/sitemap-image/1.1"
  xmlns:video="https://www.google.com/schemas/sitemap-video/1.1"
>
  <url>
    <loc>${parsed?.origin}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${parsed?.origin}/products</loc>
    <changefreq>daily</changefreq>
    <priority>1</priority>
  </url>
  ${products.map((product) => `
  <url>
    <loc>${parsed?.origin}/product/${product.id}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  `).join("")}
</urlset>`
  };
}

const _page1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	get: get$1
}, Symbol.toStringTag, { value: 'Module' }));

async function get({ request }) {
  let parsed = new URL(request.url);
  return {
    headers: {
      "Content-Type": "text/plain"
    },
    body: `User-agent: *
Disallow:
Sitemap: ${parsed?.origin}/sitemap.xml`
  };
}

const _page2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	get
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata = createMetadata("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/src/pages/404.astro", { modules: [{ module: $$module1$6, specifier: "../components/MainHead.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro = createAstro("/@fs/C:/Users/Andrei/Sites/astro-solid-shop/src/pages/404.astro", "", "file:///C:/Users/Andrei/Sites/astro-solid-shop/");
const $$404 = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$404;
  return renderTemplate`<html lang="en">
  <head>
    ${renderComponent($$result, "MainHead", $$MainHead, { "title": "Not Found" })}
  ${renderHead($$result)}</head>
  <body>
    <div class="wrapper mt4 mb4">
      <h1>Page Not Found</h1>
      <p>Not found</p>
    </div>
  </body></html>`;
});

const $$file = "C:/Users/Andrei/Sites/astro-solid-shop/src/pages/404.astro";
const $$url = "/404";

const _page3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	$$metadata,
	default: $$404,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const pageMap = new Map([['src/pages/index.astro', _page0],['src/pages/sitemap.xml.ts', _page1],['src/pages/robots.txt.ts', _page2],['src/pages/404.astro', _page3],]);
const renderers = [Object.assign({"name":"astro:jsx","serverEntrypoint":"astro/jsx/server.js","jsxImportSource":"astro"}, { ssr: server_default }),Object.assign({"name":"@astrojs/solid-js","clientEntrypoint":"@astrojs/solid-js/client.js","serverEntrypoint":"@astrojs/solid-js/server.js","jsxImportSource":"solid-js"}, { ssr: _renderer1 }),];

if (typeof process !== "undefined") {
  if (process.argv.includes("--verbose")) ; else if (process.argv.includes("--silent")) ; else ;
}

const SCRIPT_EXTENSIONS = /* @__PURE__ */ new Set([".js", ".ts"]);
new RegExp(
  `\\.(${Array.from(SCRIPT_EXTENSIONS).map((s) => s.slice(1)).join("|")})($|\\?)`
);

const STYLE_EXTENSIONS = /* @__PURE__ */ new Set([
  ".css",
  ".pcss",
  ".postcss",
  ".scss",
  ".sass",
  ".styl",
  ".stylus",
  ".less"
]);
new RegExp(
  `\\.(${Array.from(STYLE_EXTENSIONS).map((s) => s.slice(1)).join("|")})($|\\?)`
);

function getRouteGenerator(segments, addTrailingSlash) {
  const template = segments.map((segment) => {
    return segment[0].spread ? `/:${segment[0].content.slice(3)}(.*)?` : "/" + segment.map((part) => {
      if (part)
        return part.dynamic ? `:${part.content}` : part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }).join("");
  }).join("");
  let trailing = "";
  if (addTrailingSlash === "always" && segments.length) {
    trailing = "/";
  }
  const toPath = compile(template + trailing);
  return toPath;
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  return {
    ...serializedManifest,
    assets,
    routes
  };
}

const _manifest = Object.assign(deserializeManifest({"adapterName":"@astrojs/netlify/functions","routes":[{"file":"","links":["assets/index-404.44c0378e.css","assets/index.658dac06.css"],"scripts":[{"type":"inline","value":"const{classList:d}=document.documentElement,e=d.add.bind(d);e(\"jpeg\");e(\"png\");const n=(A,B)=>{const a=new Image;a.src=`data:image/${A};base64,${B}`,a.onload=e(A)};n(\"webp\",\"UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==\");n(\"avif\",\"AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=\");var t=25;window.addEventListener(\"scroll\",function(){let A=15-Math.round(Math.min(window.scrollY,300)/300*15)+10;A!=t&&(document.getElementById(\"header\")&&(document.getElementById(\"header\").className=\"header header-p-\"+A),t=A)});\n"},{"type":"external","value":"page.3aa82516.js"}],"routeData":{"route":"/","type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"page.3aa82516.js"}],"routeData":{"route":"/sitemap.xml","type":"endpoint","pattern":"^\\/sitemap\\.xml$","segments":[[{"content":"sitemap.xml","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/sitemap.xml.ts","pathname":"/sitemap.xml","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"page.3aa82516.js"}],"routeData":{"route":"/robots.txt","type":"endpoint","pattern":"^\\/robots\\.txt$","segments":[[{"content":"robots.txt","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/robots.txt.ts","pathname":"/robots.txt","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":["assets/index-404.44c0378e.css"],"scripts":[{"type":"external","value":"page.3aa82516.js"}],"routeData":{"route":"/404","type":"page","pattern":"^\\/404\\/?$","segments":[[{"content":"404","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/404.astro","pathname":"/404","_meta":{"trailingSlash":"ignore"}}}],"base":"/","markdown":{"drafts":false,"syntaxHighlight":"shiki","shikiConfig":{"langs":[],"theme":"github-dark","wrap":false},"remarkPlugins":[],"rehypePlugins":[],"isAstroFlavoredMd":false},"pageMap":null,"renderers":[],"entryModules":{"\u0000@astrojs-ssr-virtual-entry":"entry.mjs","C:/Users/Andrei/Sites/astro-solid-shop/node_modules/astro-imagetools/api/utils/imagetools.js":"chunks/imagetools.7d71676c.mjs","C:/Users/Andrei/Sites/astro-solid-shop/node_modules/astro-imagetools/api/utils/codecs.js":"chunks/codecs.95d7f143.mjs","C:/Users/Andrei/Sites/astro-solid-shop/node_modules/astro-imagetools/astroViteConfigs.js":"chunks/astroViteConfigs.e6e35cf0.mjs","C:/Users/Andrei/Sites/astro-solid-shop/node_modules/astro-imagetools/plugin/hooks/load.js":"chunks/load.efa72cdb.mjs","C:/Users/Andrei/Sites/astro-solid-shop/node_modules/astro-imagetools/plugin/utils/imagetools.js":"chunks/imagetools.72f82cbc.mjs","C:/Users/Andrei/Sites/astro-solid-shop/node_modules/astro-imagetools/plugin/utils/codecs.js":"chunks/codecs.e1182cc3.mjs","@astrojs/solid-js/client.js":"client.6bd83d78.js","/astro/hoisted.js?q=0":"hoisted.4d9b83a2.js","astro:scripts/page.js":"page.3aa82516.js","astro:scripts/before-hydration.js":"data:text/javascript;charset=utf-8,//[no before-hydration script]"},"assets":["/assets/index.658dac06.css","/assets/index-404.44c0378e.css","/client.6bd83d78.js","/favicon.ico","/page.3aa82516.js","/page.3aa82516.js"]}), {
	pageMap: pageMap,
	renderers: renderers
});
const _args = {};

const _exports = adapter.createExports(_manifest, _args);
const handler = _exports['handler'];

const _start = 'start';
if(_start in adapter) {
	adapter[_start](_manifest, _args);
}

export { sharp as a, fsCachePath as f, getSrcPath as g, handler, supportedImageTypes as s };
