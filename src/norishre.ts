import { Quiver, KeyOf, DelayedRoute, LaidRoute, RangerConfig, RangerConfigIntoQuiver, ExtraParams, Route, PeasyUIModel } from "./base-types";
import { CrimsonRanger } from "./dark-elves";


export class Norishre<const T extends Quiver> extends CrimsonRanger<T> {
	constructor(quiver: T, base_path: "" | `/${string}` = "", first_arrow?: KeyOf<T>) {
		first_arrow = first_arrow == null ? CrimsonRanger.find_arrow_id_by_url(quiver, location.pathname, base_path)[0] as KeyOf<T> : first_arrow;
		super(quiver, base_path, first_arrow);
		window.addEventListener("popstate", async () => {
			const [id, params] = this.find_arrow_id_by_url() as [KeyOf<T>, ExtraParams];
			this._prev_arrow_id = this._arrow_id;
			this._arrow_id = id as KeyOf<T>;
			if (!(id in this.quiver)) {
				return;
			}
			const arrow = this.quiver[id];
			if ("on_pulled" in arrow && typeof arrow.on_pulled == "function") {
				const model = this.models[this._arrow_id]!;
				await arrow.on_pulled({
					model,
					params,
				});
			}
		});
	}
}

export function missNorishre<const T extends RangerConfig>(config: T, path: `/${string}` | "" = "") {
	let quiver = {} as unknown as RangerConfigIntoQuiver<T>;
	for (const id of Object.keys(config) as KeyOf<T>[]) {
		const data = config[id];
		const router = typeof data.model === "function" ? {
			loaded: false,
			path: data.path,
			load: data.model,
		} satisfies DelayedRoute<any> : {
			loaded: true,
			path: data.path ?? "/**/*",
			model: data.model,
		} satisfies LaidRoute<any>;
		// @ts-expect-error
		quiver[id] = router;
	}
	type R = typeof quiver;
	// @ts-expect-error
	const mistress = new Norishre<R>(quiver, path);
	return mistress;
}
