"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Load = void 0;
var perf_hooks_1 = require("perf_hooks");
var fs_1 = __importDefault(require("fs"));
var getRandomValues = require("get-random-values");
if (typeof global !== "undefined") {
    // global already exists
}
else if (typeof window !== "undefined") {
    window.global = window;
}
else if (typeof self !== "undefined") {
    self.global = self;
}
else {
    throw new Error("cannot export Go (neither global, window nor self is defined)");
}
var enosys = function () {
    var err = new Error("not implemented");
    err.code = "ENOSYS";
    return err;
};
var process = {
    getuid: function () {
        return -1;
    },
    getgid: function () {
        return -1;
    },
    geteuid: function () {
        return -1;
    },
    getegid: function () {
        return -1;
    },
    getgroups: function () {
        throw enosys();
    },
    pid: -1,
    ppid: -1,
    umask: function () {
        throw enosys();
    },
    cwd: function () {
        return process.cwd();
    },
    chdir: function () {
        throw enosys();
    },
};
Object.defineProperties(globalThis, {
    fs: {
        value: fs_1.default,
        enumerable: true,
    },
    process: {
        value: process,
        enumerable: true,
    },
});
var util = require("util");
var encoder = new util.TextEncoder();
var decoder = new util.TextDecoder("utf-8");
var Go = /** @class */ (function () {
    function Go() {
        var _this = this;
        this.argv = ["js"];
        this.env = {};
        this.exit = function (code) {
            if (code !== 0) {
                console.warn("exit code:", code);
            }
        };
        this._exitPromise = new Promise(function (resolve) {
            _this._resolveExitPromise = resolve;
        });
        this._pendingEvent = null;
        this._scheduledTimeouts = new Map();
        this._nextCallbackTimeoutID = 1;
        var setInt64 = function (addr, v) {
            _this.mem.setUint32(addr + 0, v, true);
            _this.mem.setUint32(addr + 4, Math.floor(v / 4294967296), true);
        };
        var getInt64 = function (addr) {
            var low = _this.mem.getUint32(addr + 0, true);
            var high = _this.mem.getInt32(addr + 4, true);
            return low + high * 4294967296;
        };
        var loadValue = function (addr) {
            var f = _this.mem.getFloat64(addr, true);
            if (f === 0) {
                return undefined;
            }
            if (!isNaN(f)) {
                return f;
            }
            var id = _this.mem.getUint32(addr, true);
            return _this._values[id];
        };
        var storeValue = function (addr, v) {
            var nanHead = 0x7ff80000;
            if (typeof v === "number" && v !== 0) {
                if (isNaN(v)) {
                    _this.mem.setUint32(addr + 4, nanHead, true);
                    _this.mem.setUint32(addr, 0, true);
                    return;
                }
                _this.mem.setFloat64(addr, v, true);
                return;
            }
            if (v === undefined) {
                _this.mem.setFloat64(addr, 0, true);
                return;
            }
            var id = _this._ids.get(v);
            if (id === undefined) {
                id = _this._idPool.pop();
                if (id === undefined) {
                    id = _this._values.length;
                }
                _this._values[id] = v;
                _this._goRefCounts[id] = 0;
                _this._ids.set(v, id);
            }
            _this._goRefCounts[id]++;
            var typeFlag = 0;
            switch (typeof v) {
                case "object":
                    if (v !== null) {
                        typeFlag = 1;
                    }
                    break;
                case "string":
                    typeFlag = 2;
                    break;
                case "symbol":
                    typeFlag = 3;
                    break;
                case "function":
                    typeFlag = 4;
                    break;
            }
            _this.mem.setUint32(addr + 4, nanHead | typeFlag, true);
            _this.mem.setUint32(addr, id, true);
        };
        var loadSlice = function (addr) {
            var array = getInt64(addr + 0);
            var len = getInt64(addr + 8);
            return new Uint8Array(_this._inst.exports.mem.buffer, array, len);
        };
        var loadSliceOfValues = function (addr) {
            var array = getInt64(addr + 0);
            var len = getInt64(addr + 8);
            var a = new Array(len);
            for (var i = 0; i < len; i++) {
                a[i] = loadValue(array + i * 8);
            }
            return a;
        };
        var loadString = function (addr) {
            var saddr = getInt64(addr + 0);
            var len = getInt64(addr + 8);
            return decoder.decode(new DataView(_this._inst.exports.mem.buffer, saddr, len));
        };
        var timeOrigin = Date.now() - perf_hooks_1.performance.now();
        this.importObject = {
            go: {
                // Go's SP does not change as long as no Go code is running. Some operations (e.g. calls, getters and setters)
                // may synchronously trigger a Go event handler. This makes Go code get executed in the middle of the imported
                // function. A goroutine can switch to a new stack if the current stack is too small (see morestack function).
                // This changes the SP, thus we have to update the SP used by the imported function.
                // func wasmExit(code int32)
                "runtime.wasmExit": function (sp) {
                    sp >>>= 0;
                    var code = _this.mem.getInt32(sp + 8, true);
                    _this.exited = true;
                    delete _this._inst;
                    delete _this._values;
                    delete _this._goRefCounts;
                    delete _this._ids;
                    delete _this._idPool;
                    _this.exit(code);
                },
                // func wasmWrite(fd uintptr, p unsafe.Pointer, n int32)
                "runtime.wasmWrite": function (sp) {
                    sp >>>= 0;
                    var fd = getInt64(sp + 8);
                    var p = getInt64(sp + 16);
                    var n = _this.mem.getInt32(sp + 24, true);
                    fs_1.default.writeSync(fd, new Uint8Array(_this._inst.exports.mem.buffer, p, n));
                },
                // func resetMemoryDataView()
                "runtime.resetMemoryDataView": function (sp) {
                    sp >>>= 0;
                    _this.mem = new DataView(_this._inst.exports.mem.buffer);
                },
                // func nanotime1() int64
                "runtime.nanotime1": function (sp) {
                    sp >>>= 0;
                    setInt64(sp + 8, (timeOrigin + perf_hooks_1.performance.now()) * 1000000);
                },
                // func walltime() (sec int64, nsec int32)
                "runtime.walltime": function (sp) {
                    sp >>>= 0;
                    var msec = new Date().getTime();
                    setInt64(sp + 8, msec / 1000);
                    _this.mem.setInt32(sp + 16, (msec % 1000) * 1000000, true);
                },
                // func scheduleTimeoutEvent(delay int64) int32
                "runtime.scheduleTimeoutEvent": function (sp) {
                    sp >>>= 0;
                    var id = _this._nextCallbackTimeoutID;
                    _this._nextCallbackTimeoutID++;
                    _this._scheduledTimeouts.set(id, setTimeout(function () {
                        _this._resume();
                        while (_this._scheduledTimeouts.has(id)) {
                            // for some reason Go failed to register the timeout event, log and try again
                            // (temporary workaround for https://github.com/golang/go/issues/28975)
                            console.warn("scheduleTimeoutEvent: missed timeout event");
                            _this._resume();
                        }
                    }, getInt64(sp + 8) + 1 // setTimeout has been seen to fire up to 1 millisecond early
                    ));
                    _this.mem.setInt32(sp + 16, id, true);
                },
                // func clearTimeoutEvent(id int32)
                "runtime.clearTimeoutEvent": function (sp) {
                    sp >>>= 0;
                    var id = _this.mem.getInt32(sp + 8, true);
                    clearTimeout(_this._scheduledTimeouts.get(id));
                    _this._scheduledTimeouts.delete(id);
                },
                // func getRandomData(r []byte)
                "runtime.getRandomData": function (sp) {
                    sp >>>= 0;
                    getRandomValues(loadSlice(sp + 8));
                },
                // func finalizeRef(v ref)
                "syscall/js.finalizeRef": function (sp) {
                    sp >>>= 0;
                    var id = _this.mem.getUint32(sp + 8, true);
                    _this._goRefCounts[id]--;
                    if (_this._goRefCounts[id] === 0) {
                        var v = _this._values[id];
                        _this._values[id] = null;
                        _this._ids.delete(v);
                        _this._idPool.push(id);
                    }
                },
                // func stringVal(value string) ref
                "syscall/js.stringVal": function (sp) {
                    sp >>>= 0;
                    storeValue(sp + 24, loadString(sp + 8));
                },
                // func valueGet(v ref, p string) ref
                "syscall/js.valueGet": function (sp) {
                    sp >>>= 0;
                    var result = Reflect.get(loadValue(sp + 8), loadString(sp + 16));
                    sp = _this._inst.exports.getsp() >>> 0; // see comment above
                    storeValue(sp + 32, result);
                },
                // func valueSet(v ref, p string, x ref)
                "syscall/js.valueSet": function (sp) {
                    sp >>>= 0;
                    Reflect.set(loadValue(sp + 8), loadString(sp + 16), loadValue(sp + 32));
                },
                // func valueDelete(v ref, p string)
                "syscall/js.valueDelete": function (sp) {
                    sp >>>= 0;
                    Reflect.deleteProperty(loadValue(sp + 8), loadString(sp + 16));
                },
                // func valueIndex(v ref, i int) ref
                "syscall/js.valueIndex": function (sp) {
                    sp >>>= 0;
                    storeValue(sp + 24, Reflect.get(loadValue(sp + 8), getInt64(sp + 16)));
                },
                // valueSetIndex(v ref, i int, x ref)
                "syscall/js.valueSetIndex": function (sp) {
                    sp >>>= 0;
                    Reflect.set(loadValue(sp + 8), getInt64(sp + 16), loadValue(sp + 24));
                },
                // func valueCall(v ref, m string, args []ref) (ref, bool)
                "syscall/js.valueCall": function (sp) {
                    sp >>>= 0;
                    try {
                        var v = loadValue(sp + 8);
                        var m = Reflect.get(v, loadString(sp + 16));
                        var args = loadSliceOfValues(sp + 32);
                        var result = Reflect.apply(m, v, args);
                        sp = _this._inst.exports.getsp() >>> 0; // see comment above
                        storeValue(sp + 56, result);
                        _this.mem.setUint8(sp + 64, 1);
                    }
                    catch (err) {
                        sp = _this._inst.exports.getsp() >>> 0; // see comment above
                        storeValue(sp + 56, err);
                        _this.mem.setUint8(sp + 64, 0);
                    }
                },
                // func valueInvoke(v ref, args []ref) (ref, bool)
                "syscall/js.valueInvoke": function (sp) {
                    sp >>>= 0;
                    try {
                        var v = loadValue(sp + 8);
                        var args = loadSliceOfValues(sp + 16);
                        var result = Reflect.apply(v, undefined, args);
                        sp = _this._inst.exports.getsp() >>> 0; // see comment above
                        storeValue(sp + 40, result);
                        _this.mem.setUint8(sp + 48, 1);
                    }
                    catch (err) {
                        sp = _this._inst.exports.getsp() >>> 0; // see comment above
                        storeValue(sp + 40, err);
                        _this.mem.setUint8(sp + 48, 0);
                    }
                },
                // func valueNew(v ref, args []ref) (ref, bool)
                "syscall/js.valueNew": function (sp) {
                    sp >>>= 0;
                    try {
                        var v = loadValue(sp + 8);
                        var args = loadSliceOfValues(sp + 16);
                        var result = Reflect.construct(v, args);
                        sp = _this._inst.exports.getsp() >>> 0; // see comment above
                        storeValue(sp + 40, result);
                        _this.mem.setUint8(sp + 48, 1);
                    }
                    catch (err) {
                        sp = _this._inst.exports.getsp() >>> 0; // see comment above
                        storeValue(sp + 40, err);
                        _this.mem.setUint8(sp + 48, 0);
                    }
                },
                // func valueLength(v ref) int
                "syscall/js.valueLength": function (sp) {
                    sp >>>= 0;
                    setInt64(sp + 16, parseInt(loadValue(sp + 8).length));
                },
                // valuePrepareString(v ref) (ref, int)
                "syscall/js.valuePrepareString": function (sp) {
                    sp >>>= 0;
                    var str = encoder.encode(String(loadValue(sp + 8)));
                    storeValue(sp + 16, str);
                    setInt64(sp + 24, str.length);
                },
                // valueLoadString(v ref, b []byte)
                "syscall/js.valueLoadString": function (sp) {
                    sp >>>= 0;
                    var str = loadValue(sp + 8);
                    loadSlice(sp + 16).set(str);
                },
                // func valueInstanceOf(v ref, t ref) bool
                "syscall/js.valueInstanceOf": function (sp) {
                    sp >>>= 0;
                    _this.mem.setUint8(sp + 24, loadValue(sp + 8) instanceof loadValue(sp + 16) ? 1 : 0);
                },
                // func copyBytesToGo(dst []byte, src ref) (int, bool)
                "syscall/js.copyBytesToGo": function (sp) {
                    sp >>>= 0;
                    var dst = loadSlice(sp + 8);
                    var src = loadValue(sp + 32);
                    if (!(src instanceof Uint8Array ||
                        src instanceof Uint8ClampedArray)) {
                        _this.mem.setUint8(sp + 48, 0);
                        return;
                    }
                    var toCopy = src.subarray(0, dst.length);
                    dst.set(toCopy);
                    setInt64(sp + 40, toCopy.length);
                    _this.mem.setUint8(sp + 48, 1);
                },
                // func copyBytesToJS(dst ref, src []byte) (int, bool)
                "syscall/js.copyBytesToJS": function (sp) {
                    sp >>>= 0;
                    var dst = loadValue(sp + 8);
                    var src = loadSlice(sp + 16);
                    if (!(dst instanceof Uint8Array ||
                        dst instanceof Uint8ClampedArray)) {
                        _this.mem.setUint8(sp + 48, 0);
                        return;
                    }
                    var toCopy = src.subarray(0, dst.length);
                    dst.set(toCopy);
                    setInt64(sp + 40, toCopy.length);
                    _this.mem.setUint8(sp + 48, 1);
                },
                debug: function (value) {
                    console.log(value);
                },
            },
        };
    }
    Go.prototype.run = function (instance) {
        return __awaiter(this, void 0, void 0, function () {
            var offset, strPtr, argc, argvPtrs, keys, argv;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(instance instanceof WebAssembly.Instance)) {
                            throw new Error("Go.run: WebAssembly.Instance expected");
                        }
                        this._inst = instance;
                        this.mem = new DataView(this._inst.exports.mem.buffer);
                        this._values = [
                            // JS values that Go currently has references to, indexed by reference id
                            NaN,
                            0,
                            null,
                            true,
                            false,
                            global,
                            this,
                        ];
                        this._goRefCounts = new Array(this._values.length).fill(Infinity); // number of references that Go has to a JS value, indexed by reference id
                        this._ids = new Map([
                            [0, 1],
                            [null, 2],
                            [true, 3],
                            [false, 4],
                            [global, 5],
                            [this, 6],
                        ]);
                        this._idPool = []; // unused ids that have been garbage collected
                        this.exited = false; // whether the Go program has exited
                        offset = 4096;
                        strPtr = function (str) {
                            var ptr = offset;
                            var bytes = encoder.encode(str + "\0");
                            new Uint8Array(_this.mem.buffer, offset, bytes.length).set(bytes);
                            offset += bytes.length;
                            if (offset % 8 !== 0) {
                                offset += 8 - (offset % 8);
                            }
                            return ptr;
                        };
                        argc = this.argv.length;
                        argvPtrs = [];
                        this.argv.forEach(function (arg) {
                            argvPtrs.push(strPtr(arg));
                        });
                        argvPtrs.push(0);
                        keys = Object.keys(this.env).sort();
                        keys.forEach(function (key) {
                            argvPtrs.push(strPtr(key + "=" + _this.env[key]));
                        });
                        argvPtrs.push(0);
                        argv = offset;
                        argvPtrs.forEach(function (ptr) {
                            _this.mem.setUint32(offset, ptr, true);
                            _this.mem.setUint32(offset + 4, 0, true);
                            offset += 8;
                        });
                        this._inst.exports.run(argc, argv);
                        if (this.exited) {
                            this._resolveExitPromise();
                        }
                        return [4 /*yield*/, this._exitPromise];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Go.prototype._resume = function () {
        if (this.exited) {
            throw new Error("Go program has already exited");
        }
        this._inst.exports.resume();
        if (this.exited) {
            this._resolveExitPromise();
        }
    };
    Go.prototype._makeFuncWrapper = function (id) {
        var _this = this;
        var go = this;
        return function () {
            var arg = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                arg[_i] = arguments[_i];
            }
            var event = {
                id: id,
                this: _this,
                args: arg,
                result: null,
            };
            go._pendingEvent = event;
            go._resume();
            return event.result;
        };
    };
    return Go;
}());
function Load(filepath) {
    return __awaiter(this, void 0, void 0, function () {
        var go, ins;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    go = new Go();
                    return [4 /*yield*/, WebAssembly.instantiate(fs_1.default.readFileSync(filepath), go.importObject)];
                case 1:
                    ins = _a.sent();
                    return [4 /*yield*/, go.run(ins.instance)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.Load = Load;
exports.default = Go;
