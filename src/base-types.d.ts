export interface PeasyUIModel {
	template: string | HTMLTemplateElement;
	[x: string]: any;
	[x: number]: any;
	[x: symbol]: any;
}

export type ExtraParams = {
	path?: Record<string, string | string[]>;
	query?: Record<string, string | string[]>;
};

export type RoutePulledEvent<TData extends PeasyUIModel> = {
	model: TData, params?: ExtraParams;
};

export type RoutePulledCallback<TData extends PeasyUIModel> = (event: RoutePulledEvent<TData>) => any;

export type DelayedRoute<TData extends PeasyUIModel> = {
	path: `/${string}`;
	loaded: false,
	load: () => Promise<TData>;
	on_pulled?: RoutePulledCallback<TData>;
};

export type LaidRoute<TData extends PeasyUIModel> = {
	path: `/${string}`;
	loaded: true,
	model: TData;
	on_pulled?: RoutePulledCallback<TData>;
};

export type Route<TData extends PeasyUIModel> = DelayedRoute<TData> | LaidRoute<TData>;

export type ArrowModels<T extends Record<string, DelayedRoute<PeasyUIModel> | LaidRoute<PeasyUIModel>>> = {
	[K in keyof T]: T[K] extends DelayedRoute<infer R> ? R : T[K] extends LaidRoute<infer M> ? M : never;
};

export type KeyOf<T> = `${Exclude<keyof T, symbol>}`;
export type Quiver = Record<string, Route<any>> & {
	"%404%"?: LaidRoute<PeasyUIModel>;
};

export type RangerConfig = Record<string, { path: `/${string}`, model: PeasyUIModel | (() => Promise<PeasyUIModel>); }> & { "%404%"?: { path: "/**/*", model: PeasyUIModel; }; };
export type RangerConfigIntoQuiver<T extends RangerConfig> = {
	[k in keyof T]: T[k]["model"] extends PeasyUIModel ? {
		loaded: true, path: T[k]["path"], model: T[k]["model"],
	} : T[k]["model"] extends () => Promise<PeasyUIModel> ? {
		loaded: false, path: T[k]["path"], load: T[k]["model"],
	} : never;
};
