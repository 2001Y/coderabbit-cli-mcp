type ConfigurableKeys = {
    mode?: string;
    type?: string;
    configFiles?: string[];
};
export interface RunReviewConfigSection {
    lock?: Partial<ConfigurableKeys>;
}
export declare function getRunReviewConfig(): RunReviewConfigSection;
export {};
