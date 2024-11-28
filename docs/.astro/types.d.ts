declare module 'astro:content' {
	interface Render {
		'.mdx': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
		}>;
	}
}

declare module 'astro:content' {
	interface Render {
		'.md': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
		}>;
	}
}

declare module 'astro:content' {
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[]
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[]
	): Promise<CollectionEntry<C>[]>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"docs": {
"v1/docs/start/setup.mdx": {
	id: "v1/docs/start/setup.mdx";
  slug: "v1/docs/start/setup";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/examples/all.mdx": {
	id: "v2/examples/all.mdx";
  slug: "v2/examples/all";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/other/for-library-authors.mdx": {
	id: "v2/other/for-library-authors.mdx";
  slug: "v2/other/for-library-authors";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/other/for-sponsors.mdx": {
	id: "v2/other/for-sponsors.mdx";
  slug: "v2/other/for-sponsors";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/breakpoints.mdx": {
	id: "v2/reference/breakpoints.mdx";
  slug: "v2/reference/breakpoints";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/compound-variants.mdx": {
	id: "v2/reference/compound-variants.mdx";
  slug: "v2/reference/compound-variants";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/content-size-category.mdx": {
	id: "v2/reference/content-size-category.mdx";
  slug: "v2/reference/content-size-category";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/create-stylesheet.mdx": {
	id: "v2/reference/create-stylesheet.mdx";
  slug: "v2/reference/create-stylesheet";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/debugging.mdx": {
	id: "v2/reference/debugging.mdx";
  slug: "v2/reference/debugging";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/dimensions.mdx": {
	id: "v2/reference/dimensions.mdx";
  slug: "v2/reference/dimensions";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/dynamic-functions.mdx": {
	id: "v2/reference/dynamic-functions.mdx";
  slug: "v2/reference/dynamic-functions";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/edge-to-edge.mdx": {
	id: "v2/reference/edge-to-edge.mdx";
  slug: "v2/reference/edge-to-edge";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/errors.mdx": {
	id: "v2/reference/errors.mdx";
  slug: "v2/reference/errors";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/faq.mdx": {
	id: "v2/reference/faq.mdx";
  slug: "v2/reference/faq";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/media-queries.mdx": {
	id: "v2/reference/media-queries.mdx";
  slug: "v2/reference/media-queries";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/plugins.mdx": {
	id: "v2/reference/plugins.mdx";
  slug: "v2/reference/plugins";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/server-side-rendering.mdx": {
	id: "v2/reference/server-side-rendering.mdx";
  slug: "v2/reference/server-side-rendering";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/testing.mdx": {
	id: "v2/reference/testing.mdx";
  slug: "v2/reference/testing";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/theming.mdx": {
	id: "v2/reference/theming.mdx";
  slug: "v2/reference/theming";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/unistyles-provider.mdx": {
	id: "v2/reference/unistyles-provider.mdx";
  slug: "v2/reference/unistyles-provider";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/unistyles-registry.mdx": {
	id: "v2/reference/unistyles-registry.mdx";
  slug: "v2/reference/unistyles-registry";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/unistyles-runtime.mdx": {
	id: "v2/reference/unistyles-runtime.mdx";
  slug: "v2/reference/unistyles-runtime";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/use-initial-theme.mdx": {
	id: "v2/reference/use-initial-theme.mdx";
  slug: "v2/reference/use-initial-theme";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/use-styles.mdx": {
	id: "v2/reference/use-styles.mdx";
  slug: "v2/reference/use-styles";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/variants.mdx": {
	id: "v2/reference/variants.mdx";
  slug: "v2/reference/variants";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/reference/web-support.mdx": {
	id: "v2/reference/web-support.mdx";
  slug: "v2/reference/web-support";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/start/basic-usage.mdx": {
	id: "v2/start/basic-usage.mdx";
  slug: "v2/start/basic-usage";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/start/benchmarks.mdx": {
	id: "v2/start/benchmarks.mdx";
  slug: "v2/start/benchmarks";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/start/introduction.mdx": {
	id: "v2/start/introduction.mdx";
  slug: "v2/start/introduction";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/start/migration-from-1.mdx": {
	id: "v2/start/migration-from-1.mdx";
  slug: "v2/start/migration-from-1";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/start/migration-from-stylesheet.mdx": {
	id: "v2/start/migration-from-stylesheet.mdx";
  slug: "v2/start/migration-from-stylesheet";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"v2/start/setup.mdx": {
	id: "v2/start/setup.mdx";
  slug: "v2/start/setup";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
};

	};

	type DataEntryMap = {
		"i18n": Record<string, {
  id: string;
  collection: "i18n";
  data: InferEntrySchema<"i18n">;
}>;

	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = typeof import("../src/content/config.js");
}
