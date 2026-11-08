interface LoaderSettings {
  baseUrl: string;
  service?: string;
  basePath: string;
  prefix: string;
}

interface LoaderContext {
  resourcePath: string;
  getOptions(): LoaderSettings;
  async(): (error: Error | null, result?: string) => void;
}

function imageForgeLoader(this: LoaderContext, source: string): void {
  const callback = this.async();
  const settings = this.getOptions();
  if (!source.includes(settings.prefix)) {
    callback(null, source);
    return;
  }

  const filename = this.resourcePath;
  import("./jsx-transformer.js").then(
    ({ transformJsx }) => {
      let output: string;
      try {
        output = transformJsx(source, filename, settings);
      } catch (error) {
        callback(error as Error);
        return;
      }
      callback(null, output);
    },
    (error: Error) => callback(error),
  );
}

export = imageForgeLoader;
