export interface PreviewSelection {
    readonly selected: string;
    select(id: string): void;
    reset(): void;
}
