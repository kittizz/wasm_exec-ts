declare class Go {
    importObject: Record<string, any>;
    argv: string[];
    exit: (code: any) => void;
    private _exitPromise;
    private _resolveExitPromise;
    private _pendingEvent;
    private _scheduledTimeouts;
    private _nextCallbackTimeoutID;
    mem: any;
    private _values;
    private _ids;
    private _idPool;
    private _goRefCounts;
    private _inst;
    exited: boolean | undefined;
    env: any;
    constructor();
    run(instance: any): Promise<void>;
    _resume(): void;
    _makeFuncWrapper(id: any): any;
}
export declare function Load(filepath: string): Promise<void>;
export default Go;
