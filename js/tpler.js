//工具 继承自underscore  + jquery
//原型扩展  Element Array strig Number Object
//模板解析  parser El ->  tpl -> tag  -> attr 
//事件模块  toucher，支持类型tap  click，移动开发自动切换到tap模式


// 模板解析
//模板{=text}
//自动循环
//options=
// {
// el:"",
// data:""
// }

// <div class="swiper-wrapper" template="_ppt_tpl" lazy="_ppt_tpl_lazy" data="picArr">
// <script type="text/template" id="_ppt_tpl">
//     <div class="swiper-slide" style="background-image: url('{=picUrl|n_800_600}');"></div>
// </script>
// <script type="text/template" id="_ppt_tpl_lazy">
//     <div class="swiper-slide">
//         <div data-background="{=picUrl|n_800_600}" class="swiper-lazy"></div>
//     </div>
// </script>
//A pipe character (|) The name of the filter
// filters:{
//    "abc":function(data){
//     return "test"+data
//    }

// }

// <div class="directory_ItemList" template="_course_dir_tpl" group="_course_dir_group_tpl"></div>

// <div class="comment_overview" template="_course_comment_overview_tpl" noloop>
//                                     </div>
//                                     <div class="comment" template="_course_comment_tpl">
//                                     </div>

// the events module
// toucher({
//                el: "#li" + len,
//                type: "tap",
//                clear:true,
//                once: true,
//                callback: function(item, ev) {
//                    console.log(item, this)
//                }.bind(len)
//            });
//模板 {=field|filter}  filters过滤器 methods方法 events事件代理 driectives自定义指令 on指令  model双向绑定 bind单向绑定 before预处理 after/callback后处理
//事件 : tap快击 drag拖动 scroll滚动，上下滑动 swipe翻页，左右滑动   
//路由  ?id=1#route
//其他解析器 markdown  json 四则运算 与非
//基础对象处理工具  array object string number  date
;
(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define('tpler', [], factory);
    } else {
        root.tpler = factory();
    }
}(this,
    function() {
        // var reg_tpl_tag = /{=([\s\S]+?)}/g; //模板标签  ([^|]+?[\|(string|file|image|time)]?
        var reg_tpl_tag = /{=(.*?)(?:\|(.*?))?}/g
        // var reg_tpl_name = /<!--\s*([\S]+?)\s*-->/g; //模板名称备注
        var reg_operation_symbol = /[\+|\-|\*|\/|\(|\)]+/g; //支持 加减乘除括号  operation symbol
        var rootEl, $index = 1,
            $length = 1,
            toucher,
            customFilters = {}; //扩展类型
        var customSyntax = ""; //书写语法   pre markdown  html text 文本格式类型
        var customMethods = {},
            customDirectives = {},
            templateConfig = {},
            _syntax = "syntax",
            _group = "group",
            _lazy = "lazy",
            _more = "more",
            _default = "default",
            _data = "data",
            _pagesize = "pagesize",
            _keyword = "keyword",
            _template = "template",
            _noloop = "noloop",
            _loop = "loop",
            // _active = "active",
            _on = "on", //绑定事件
            _model = "model", //双向绑定模型
            _bind = "bind", //单向绑定
            // _if = "if",
            // _tabs = "tabs",
            _tap = "tap",
            _drag = "drag";

        var isSupportTouch = "ontouchend" in document ? true : false; // window.Touch? true : false;

        var supportTouch = function() {
            try {
                document.createEvent("TouchEvent");
                return true;
            } catch (e) {
                return false;
            }
        }();


        var _extends = Object.assign || function(target) {
            for (var i = 1; i < arguments.length; i++) {
                var source = arguments[i];
                for (var key in source) {
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                        target[key] = source[key];
                    }
                }
            }
            return target;
        };


        // if (typeof Object.assign != 'function') {
        //     (function() {
        //         Object.assign = function(target) {
        //             'use strict';
        //             if (target === undefined || target === null) {
        //                 throw new TypeError('Cannot convert undefined or null to object');
        //             }

        //             var output = Object(target);
        //             for (var index = 1; index < arguments.length; index++) {
        //                 var source = arguments[index];
        //                 if (source !== undefined && source !== null) {
        //                     for (var nextKey in source) {
        //                         if (source.hasOwnProperty(nextKey)) {
        //                             output[nextKey] = source[nextKey];
        //                         }
        //                     }
        //                 }
        //             }
        //             return output;
        //         };
        //     })();
        // }



        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        }();


        // Browser environment sniffing

        var inBrowser = typeof window !== 'undefined';
        var UA = inBrowser && window.navigator.userAgent.toLowerCase();
        var isIE = UA && /msie|trident/.test(UA);
        var isIE9 = UA && UA.indexOf('msie 9.0') > 0;
        var isEdge = UA && UA.indexOf('edge/') > 0;
        var isAndroid = UA && UA.indexOf('android') > 0;
        var isIOS = UA && /iphone|ipad|ipod|ios/.test(UA);
        var isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge;

        var weixin = UA.toLowerCase().match(/MicroMessenger/i) == "micromessenger";

        var envt = {
            inBrowser: inBrowser,
            UA: UA,
            isIE: isIE,
            isIE9: isIE9,
            isEdge: isEdge,
            isAndroid: isAndroid,
            isIOS: isIOS,
            isChrome: isChrome,
            weixin: weixin
        };


        // Save bytes in the minified (but not gzipped) version:
        var ArrayProto = Array.prototype,
            ObjProto = Object.prototype;
        // Create quick reference variables for speed access to core prototypes.
        var push = ArrayProto.push,
            slice = ArrayProto.slice,
            concat = ArrayProto.concat,
            toString = ObjProto.toString,
            hasOwnProperty = ObjProto.hasOwnProperty;

        // All **ECMAScript 5** native function implementations that we hope to use
        // are declared here.
        var nativeForEach = ArrayProto.forEach,
            nativeMap = ArrayProto.map,
            nativeFilter = ArrayProto.filter,
            nativeSome = ArrayProto.some,
            nativeEvery = ArrayProto.every,
            nativeIndexOf = ArrayProto.indexOf;


        function TimeCom(dateValue) {
            var newCom;
            if (dateValue == "") {
                newCom = new Date();
            } else {
                newCom = new Date(dateValue);
            }
            this.year = newCom.getFullYear();
            this.month = newCom.getMonth() + 1;
            this.day = newCom.getDate();
            this.hour = newCom.getHours();
            this.minute = newCom.getMinutes();
            this.second = newCom.getSeconds();
            this.msecond = newCom.getMilliseconds();
            this.week = newCom.getDay();
        }
        //工具  underscore  + jquery
        var _ = {
            envt: envt,
            toDate: function(str) {
                if (/^\d*$/.test(str)) {
                    return new Date(Number(str));
                } else if (_.isString(str)) {
                    return new Date(Date.parse(str.replace(/-/g, "/")));
                }
                return str;
            },
            dateAdd: function(interval, number, date) {
                var date;
                if (_.isString(date)) {
                    date = _.toDate(date)
                } else {
                    date = new Date(date);
                }
                switch (interval.toLowerCase()) {
                    case "y":
                    case "year":
                        return new Date(date.setFullYear(date.getFullYear() + number));
                    case "m":
                    case "month":
                        return new Date(date.setMonth(date.getMonth() + number));
                    case "d":
                    case "day":
                        return new Date(date.setDate(date.getDate() + number));
                    case "w":
                    case "week":
                        return new Date(date.setDate(date.getDate() + 7 * number));
                    case "h":
                    case "hour":
                        return new Date(date.setHours(date.getHours() + number));
                    case "n":
                    case "min":
                    case "minute":
                        return new Date(date.setMinutes(date.getMinutes() + number));
                    case "s":
                    case "second":
                        return new Date(date.setSeconds(date.getSeconds() + number));
                    case "l":
                    case "ms":
                    case "msecond":
                        return new Date(date.setMilliseconds(date.getMilliseconds() + number));
                }
            },
            dateDiff: function(interval, date1, date2) {

                var TimeCom1 = new TimeCom(date1);
                var TimeCom2 = new TimeCom(date2);
                var result;
                switch (String(interval).toLowerCase()) {
                    case "y":
                    case "year":
                        result = TimeCom1.year - TimeCom2.year;
                        break;
                    case "m":
                    case "month":
                        result = (TimeCom1.year - TimeCom2.year) * 12 + (TimeCom1.month - TimeCom2.month);
                        break;
                    case "d":
                    case "day":
                        result = Math.round((Date.UTC(TimeCom1.year, TimeCom1.month - 1, TimeCom1.day) - Date.UTC(TimeCom2.year, TimeCom2.month - 1, TimeCom2.day)) / (1000 * 60 * 60 * 24));
                        break;
                    case "h":
                    case "hour":
                        result = Math.round((Date.UTC(TimeCom1.year, TimeCom1.month - 1, TimeCom1.day, TimeCom1.hour) - Date.UTC(TimeCom2.year, TimeCom2.month - 1, TimeCom2.day, TimeCom2.hour)) / (1000 * 60 * 60));
                        break;
                    case "n":
                    case "min":
                    case "minute":
                        result = Math.round((Date.UTC(TimeCom1.year, TimeCom1.month - 1, TimeCom1.day, TimeCom1.hour, TimeCom1.minute) - Date.UTC(TimeCom2.year, TimeCom2.month - 1, TimeCom2.day, TimeCom2.hour, TimeCom2.minute)) / (1000 * 60));
                        break;
                    case "s":
                    case "second":
                        result = Math.round((Date.UTC(TimeCom1.year, TimeCom1.month - 1, TimeCom1.day, TimeCom1.hour, TimeCom1.minute, TimeCom1.second) - Date.UTC(TimeCom2.year, TimeCom2.month - 1, TimeCom2.day, TimeCom2.hour, TimeCom2.minute, TimeCom2.second)) / 1000);
                        break;
                    case "l":
                    case "ms":
                    case "msecond":
                        result = Date.UTC(TimeCom1.year, TimeCom1.month - 1, TimeCom1.day, TimeCom1.hour, TimeCom1.minute, TimeCom1.second, TimeCom1.msecond) - Date.UTC(TimeCom2.year, TimeCom2.month - 1, TimeCom2.day, TimeCom2.hour, TimeCom2.minute, TimeCom2.second, TimeCom1.msecond);
                        break;
                    case "w":
                    case "week":
                        result = Math.round((Date.UTC(TimeCom1.year, TimeCom1.month - 1, TimeCom1.day) - Date.UTC(TimeCom2.year, TimeCom2.month - 1, TimeCom2.day)) / (1000 * 60 * 60 * 24)) % 7;
                        break;
                    default:
                        result = "invalid";
                }
                return (result);

            },
            //一年中的第几周
            week: function(dateStr) {
                // var b = _.toDate(dateStr);
                // var s = (new Date() - b) / (60 * 60 * 24 * 1000);
                // if (s < 0) return false;
                // return (b.getDay() == 0) ? Math.ceil(s / 7) : Math.ceil(s / 7) + 1;

                var totalDays = 0;
                var d = _.toDate(dateStr); //new Date();
                if (!d) return "";
                var years = d.getFullYear();
                // if (years < 1000)
                //     years += 1900
                var days = new Array(12);
                days[0] = 31;
                days[2] = 31;
                days[3] = 30;
                days[4] = 31;
                days[5] = 30;
                days[6] = 31;
                days[7] = 31;
                days[8] = 30;
                days[9] = 31;
                days[10] = 30;
                days[11] = 31;

                //判断是否为闰年，针对2月的天数进行计算
                if (Math.round(d.getFullYear() / 4) == d.getFullYear() / 4) {
                    days[1] = 29
                } else {
                    days[1] = 28
                }

                if (d.getMonth() == 0) {
                    totalDays = totalDays + d.getDate();
                } else {
                    var curMonth = d.getMonth();
                    for (var count = 1; count <= curMonth; count++) {
                        totalDays = totalDays + days[count - 1];
                    }
                    totalDays = totalDays + d.getDate();
                }
                //得到第几周
                var result = Math.round(totalDays / 7);
                return result;
            },
            month: function(dateStr) {
                var d = _.toDate(dateStr);
                return d ? d.getMonth() : "";
            },
            // //todo
            // toString(date, likeFormate) {
            //     console.log(date);
            //     return date.format("yyyy-MM-dd");
            // },
            text: function(obj) {
                //HTMLScriptElement.text  是一个属性，故用此方法
                if (_.isElement(obj)) {
                    return obj.innerText;
                }
            },
            html: function(obj) {
                if (_.isElement(obj)) {
                    return obj.innerHTML;
                }
            },
            fast: function() {
                var _run = function(fn, index, times) {
                    var t1, t2;
                    t1 = (new Date()).getTime();
                    for (var i = 1; i <= times; i++) {
                        fn.call(this);
                    }
                    t2 = (new Date()).getTime();
                    console.log("fn {" + fn.name + "} _run " + times + " times ,last: " + (t2 - t1) + "ms")
                    return t2 - t1;
                }

                var args = slice.call(arguments),
                    last = args.pop(),
                    times = 10000;
                if (_.isNumber(last)) {
                    times = last;
                } else {
                    args.push(last);
                }
                for (var i = 0; i < args.length; i++) {
                    args[i] && _run.call(this, args[i], i, times);
                }

            },
            //位置信息
            pos: function(e) {
                function CPos(x, y, el) {
                    this.x = x;
                    this.y = y;
                    this.time = +(new Date());
                    this.el = el;

                }
                if (_.isElement(e)) { //元素
                    var el = e;

                    function _pos(el) {
                        var pos = new CPos(el.offsetLeft, el.offsetTop, el);
                        var target = el.offsetParent;
                        while (target) {
                            pos.x += target.offsetLeft;
                            pos.y += target.offsetTop;
                            target = target.offsetParent
                        }
                        return pos;
                    }
                    return _pos(el);

                } else if (_.isTouchEvent(e) || _.isMouseEvent(e)) { //事件
                    var ev = e,
                        x, y,
                        el = ev.currentTarget;
                    var _touches = ev.touches && ev.touches.length > 0 ? ev.touches : ev.changedTouches;
                    if (!_touches || _touches.length === 0) {
                        x = ev.clientX;
                        y = ev.clientY;
                    } else {
                        var pos = _touches[0];
                        x = pos.pageX;
                        y = pos.pageY;
                    }
                    return new CPos(x, y, el);
                }
            },
            //url信息
            parseUrl: function(url) {
                var params = {},
                    hash = location.hash,
                    route = hash;
                var url = url || window.location.href;

                var domain, host, port;
                url.replace(/http[s]?:\/\/([^:]*?)(?::(\d+))?\//, function(d, h, p) {
                    domain = d.substring(0, d.length - 1);
                    host = h;
                    port = p;
                })

                var getHash = function() {
                    var match = url.match(/#(.*)$/);
                    return match ? match[1] : '';
                };
                var decodeFragment = function(fragment) {
                    return decodeURI(fragment.replace(/%25/g, '%2525'));
                };
                var getSearch = function() {
                    var match = location.href.replace(/#.*/, '').match(/\?.+/);
                    return match ? match[0] : '';
                };
                var getPath = function() {
                    var path = decodeFragment(
                        location.pathname + getSearch()
                    ).slice(0);
                    return path.charAt(0) === '/' ? path.slice(1) : path;
                };
                var path = getPath();

                hash = getHash();
                // api.html?id=3&page=fff#events
                // api.html#events?id=3&page=fff
                // api.html#events/1122
                url.replace(/[?&](.+?)=([^&#]*)/g, function(_, k, v) {
                    params[k] = decodeURI(v)
                });
                //#去重
                if (hash) {
                    hash = hash.length > 1 ? hash.replace(/#+/g, "#") : "";
                    route = hash.replace(/#/g, "");
                }
                return {
                    params: params,
                    hash: hash,
                    route: route,
                    path: path,
                    domain: domain,
                    host: host,
                    port: port
                }
            },
            guid: 1,
            //  生成一个随机id
            uId: function() {
                return Math.random().toString(16).slice(2);
            },
            //随机id
            random: function(possible, len, prefix) {

                if (_.isArray(possible)) {
                    return possible[Math.floor(Math.random() * possible.length)];
                } else {
                    var str = prefix || "_",
                        len = len || 6,
                        possible = possible || "abcdefghijklmnopqrstuvwxyz"; //ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789
                    for (var i = 0; i < len; i++) {
                        str += possible.charAt(Math.floor(Math.random() * possible.length));
                    }
                    return str;
                }
            },
            autoid: function(ele, force) {
                var _autoid = function(ele) {
                    if (_.isDocument(ele)) {
                        return ele;
                    }
                    if (_.isElement(ele)) {
                        if (force) {
                            ele.setAttribute("id", _.random());
                        } else {
                            if (_.isEmpty(ele.id)) {
                                ele.setAttribute("id", _.random());
                            }
                        }
                    }
                    return ele;
                };

                if (_.isArray(ele)) {
                    var arr = [];
                    ele.forEach(function(t) {
                        arr.push(_autoid(t));
                    });
                    return arr;
                } else {
                    return _autoid(ele);
                }
            },
            //Array.prototype.find已经存在，所以使用query
            //返回结果
            //找不到 返回  []，与 closest addclass removeclass等统一[] ，方便链式写
            //找到数组 [el]，长度为1的时，返回 el  ，方便 siblings链式
            query: function(selector) {
                var args = slice.call(arguments),
                    len = args.length;
                if (len > 1) {
                    selector = args.join(",")
                }
                if (_.isWindow(selector) || _.isDocument(selector)) {
                    return selector;
                }
                if (_.isFunction(selector)) {
                    selector();
                    return [];
                }
                var _selectorFn = function(selector) {
                    if (_.isElement(this)) {
                        _.autoid(this);
                        if (this.id) {
                            var arr = selector.split(",");
                            var base = "#" + this.id;
                            selector = base + arr.join("," + base) + "," + base + " " + arr.join("," + base + " ");
                        }
                    }
                    return selector;
                }

                if (_.isElement(selector)) {
                    _.autoid(selector);
                    if (_.isElement(this)) {
                        selector = "#" + selector.id;
                        selector = _selectorFn.call(this, selector);
                    } else {
                        return selector;
                    }
                } else if (_.isArray(selector)) {
                    var result = [];
                    selector.forEach(function(item) {
                        result.push(_.query(item));
                    });
                    return result;
                } else if (_.isJQuery(selector)) { //兼容JQuery
                    if (selector.length == 1) {
                        return selector.get(0);
                    } else {
                        var result = [];
                        for (var i = 0; i < selector.length; i++) {
                            result.push(selector.get(i));
                        }
                        return result;
                    }
                } else {
                    selector = _selectorFn.call(this, selector);
                }

                try {
                    var eles = document.querySelectorAll(selector),
                        args = slice.call(eles),
                        len = args.length;

                    if (len == 0) {
                        return [];
                    } else if (len == 1) {
                        return _.autoid(args[0]);
                    } else if (len > 1) {
                        return _.autoid(args);
                    }

                } catch (e) {
                    console.log(e);
                    //jQuery特有表达式 :filter
                    var arr = selector.split(":");
                    if (arr.length > 1) {
                        return _.query(arr[0]).filter(arr[1]);
                    }
                    return [];
                }
            },

            // filters
            //JavaScript对象
            //代替JSON.parse() 和   $.parseJSON 必须遵从格式完好
            // 格式完好"，指字符串必须符合严格的JSON格式，属性名称必须加双引号、字符串值也必须用双引号。
            //JSON标准不允许字符串中出现"控制字符"，例如：一个Tab或换行符。正确写法应该如下(使用两个反斜杠，以免被JS解析器直接转义\t或\n)：
            //格式不完好的json字符串处理 "{id:1}"
            //不必符合严格的JSON格式，例如：属性名称必须加双引号、字符串值也必须用双引号。
            //非标准格式json
            json: function(str) {
                if (_.isEmpty(str)) {
                    return {}
                }
                try {
                    return JSON.parse(str)
                } catch (e1) {
                    try {
                        return eval("(" + str + ")");
                    } catch (e2) {
                        console.log(e2);
                        return e2;
                    }
                }
                // for bad json string
                //`{name:hhoh}`
                // `{\"id:\'1\'}`
                //"{\"id\":'1'}"
                // `{name:a\"bcd}`
                // `{name:'a\"bcd'}`
                //`{id:1,name:'haha,hi:jjo',hh:{Id:33}}`
                // Bad JSON escape sequence 解决方案
                // var _parseObj = function() {
                //     var obj_re = /^{([\s\S]*?):([\s\S]*)}$/
                //     var result = {}
                //     str.replace(obj_re, function(macth, key, val) {
                //         result[key] = val
                //     })
                //     return result
                // }
                // //[{a:1,b:2},{c:3}]  [1,2,3]
                // var _parseArr=function(){
                //     var arr_re=/^\[[\s\S]*\]$/
                //     var result=[];

                // }

            },
            //代替 JSON.stringify()
            stringify: function(obj) {
                var sb = [],
                    str = "",
                    k, v;
                if (_.isUndefined(obj)) {
                    str = "undefined";
                } else if (_.isBoolean(obj)) {
                    str = obj ? "true" : "false"
                } else if (_.isString(obj)) {
                    str = "\"" + obj + "\""
                } else if (_.isNumber(obj)) {
                    str = obj;
                } else if (_.isDocument(obj)) {
                    str = "#document"
                } else if (_.isElement(obj)) {
                    str = obj.tagName.toLowerCase();
                    str += obj.id ? "#" + obj.id : "";
                    str += obj.className ? "." + obj.className.replace(/\s+/g, ".") : "";
                } else if (_.isFunction(obj)) {
                    str = "function " + obj.prototype.constructor.name + "(){}"
                } else if (_.isArray(obj)) {
                    obj.forEach(function(t) {
                        sb.push(_.stringify(t))
                    })
                    str = "[" + sb.join(",") + "]";
                } else if (_.isObject(obj)) {
                    for (k in obj) {
                        sb.push("\"" + k + "\":");
                        v = obj[k];

                        if (_.isArray(v)) {
                            v.forEach(function(t) {
                                sb.push(_.stringify(t))
                            })
                        } else {
                            sb.push(_.stringify(v))
                        }
                        sb.push(",")
                    }
                    sb.pop();
                    str = "{" + sb.join("") + "}";
                } else if (_.isMouseEvent(obj)) {
                    str = "MouseEvent";
                    str += "(" + _.stringify(obj.target) + ")"
                } else if (_.isTouchEvent(obj)) {
                    str = "TouchEvent";
                    str += "(" + _.stringify(obj.target) + ")"
                } else {
                    str = "unknowtype";
                }
                return str;
            },
            //符合格式的json字符串
            toJSONString: function(json) {
                if (_.isObject(json)) {
                    return JSON.stringify(json)
                } else {
                    return json
                }
            },
            color: function() { //随机颜色
                // return '#'+('00000'+(Math.random()*0x1000000<<0).toString(16)).slice(-6);
                // var co="hsla("+Math.ceil(Math.random()*360)+",50%,50%,0.5)"
                var co = "hsl(" + Math.ceil(Math.random() * 360) + ",50%,50%)";
                console.log(co);
                return co;
            },
            isHtml: function(tpl) {
                // return /<\S*?>/.test(tpl);
                // return /<^>*?>/.test(tpl);
                return /<(\S*?) [^>]*>.*?<\/\1>|<.*?\/?>/.test(tpl);
            },
            enHtml: function(tpl) {
                return tpl.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            },
            deHtml: function(tpl) {
                return tpl.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
            },
            preHtml: function(tpl) {
                // return tpl.replace(/\r\n?/g, "<br>");
                return tpl.replace(/\n/g, "<br>").replace(/\r/g, "<br>");
            },
            getBody: function(content) {
                var REG_BODY = /<body[^>]*>([\s\S]*)<\/body>/i;
                var matcher = content.match(REG_BODY);
                return matcher && matcher.length > 1 ? matcher[1] : content;
            },
            markdown: function(tpl) {
                if (_.isEmpty(tpl)) {
                    tpl = '# 标题  ## 标题2  \n' +
                        '*粗体*  **粗体**  _斜体_ \n' +
                        '***分割___分割---  \n' +
                        '> 引用1 \n' +
                        '> 引用2 \n' +
                        '* 列表项目1 \n* 列表项目2 \n' +
                        '- 列表项目1 \n- 列表项目2 \n' +
                        '+ 列表1\n+ 列表2 \n ' +
                        '1. 列表1\n2. 列表2 \n ' +
                        "[1连接](www.xxx.com) [2连接](www.xxx.com) [3连接](www.xxx.com) [4连接](www.xxx.com) [5连接](www.xxx.com)\n" +
                        '[Ivan Dementev][]\n' +
                        '[Ivan Dementev]: https://github.com/DiVAN1x \n' +
                        "|表格|字段1|字段2|\n|---|---|---|\n|你好|呵呵|吼吼|\n" +
                        '`for(var i=0;i<10,i++) if(i>=5) alert("")`'
                    console.log(tpl.replace(/\r?\n/g, "\\r\\n\r\n"))
                }

                //注意先后顺序
                var regs = [
                    // 区块引用 >
                    { tag: "blockquote", reg: /(>\s.+\r?\n)+/g },
                    //表格 
                    { tag: "table", reg: /(\|.+\|\r?\n)+/g },
                    //标题 #
                    { tag: "h6", reg: /#{6}\s(.+)/g },
                    { tag: "h5", reg: /#{5}\s(.+)/g },
                    { tag: "h4", reg: /#{4}\s(.+)/g },
                    { tag: "h3", reg: /#{3}\s(.+)/g },
                    { tag: "h2", reg: /#{2}\s(.+)/g },
                    { tag: "h1", reg: /#{1}\s(.+)/g },
                    //连接
                    // { tag: "img", reg: /\[img\]\((.*?)\)/g },
                    { tag: "img", reg: /!\[(.*?)\]\((.*?)\)/g },
                    { tag: "marklink", reg: /\[(.*?)\]\[(.*?)\]/ },

                    //[Philipp A]: https://github.com/flying-sheep
                    { tag: "ref", tag: /\[.*?\]:\s+(https?:\/\/.+)/ },
                    { tag: "a", reg: /\[(.*?)\]\((.*?)\)|(https?:\/\/.+)/g },

                    // { tag: "a", reg: /\[(.*?)\]\((.*?)\)/g },
                    // { tag: "a", reg: /(https?:\/\/.+)/g },

                    //分隔
                    { tag: "hr", reg: /[\*|\-|_]{3,}/g },
                    //强调
                    { tag: "strong", reg: /\*\*(.*?)\*\*/g },
                    { tag: "em", reg: /\*(.*?)\*/g },
                    //斜体
                    { tag: "i", reg: /[\s\n]_(.*?)_[\s|\n]/g },
                    //列表
                    // { tag: "ul", reg: /(\s+[\*-]\s.+\r?\n)+/g },
                    // { tag: "ul", reg: /([\*-]\s.+(\r?\n|$))+/g }, //[\n]
                    // { tag: "ul", reg: /([\*-]\s[\s\S]+)+/g },

                    // { tag: "test", reg: /(\s*?-\s[^(-\s)]*)+/g },
                    //\d+[.)][\n ]



                    { tag: "ul", reg: /(?:-\s[\s\S]*)?-\s.*(\r?\n|$)/g },
                    { tag: "ul", reg: /(?:\*\s[\s\S]*)?\*\s.*(\r?\n|$)/g },
                    // { tag: "ul", reg: /(\s*?-\s[\s\S]+(?:\r?\n|$))+/g },
                    // { tag: "ul", reg: /(\s*?-\s.+[\r?\n|$])+|(\s*?\*\s.+[\r?\n|$])+/g },
                    // { tag: "ul", reg: /(\s*?-\s.+[\r?\n|$])+/g },
                    // { tag: "ul", reg: /(\s*?\*\s.+[\r?\n|$])+/g },


                    // { tag: "ul", reg: /(-\s[^-]+)+(\r?\n|$)?/g },
                    // { tag: "ul", reg: /(\*\s[^-]+)+?(\r?\n|$)?/g },
                    // { tag: "ul", reg: /(\s{2,4}-\s[^-]+)+$?/g },
                    // { tag: "ul", reg: /(-\s.+?(\r?\n|$))+/g },
                    // { tag: "ul", reg: /(\*\s.+?(\r?\n|$))+/g },
                    // { tag: "ul", reg: /(\-\s.+[\n]){1,}/g },
                    // { tag: "ul", reg: /(-\s.+\r?\n){1,}/g },

                    { tag: "ol", reg: /(\+\s.+\r?\n)+|(\d\.\s.+\r?\n)+/g },
                    // { tag: "ol", reg: /(\+\s.+\r?\n)+/g },
                    // { tag: "ol2", reg: /(\d\.\s.+\r?\n)+/g },

                    // { tag: "ol", reg: /([\+|\d\.]\s.+\r?\n){1,}/g },

                    { tag: "code", reg: /`([\s\S]+)`/g },

                    //换行
                    { tag: "br", reg: /\r?\n/g },
                ]
                //var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');

                var _star = function(tag, options) {
                    var sb = [];
                    sb.push('<');
                    sb.push(tag);
                    for (var key in options) {
                        sb.push(' ' + key + '="' + options[key] + '"');
                    }
                    sb.push('>');
                    return sb.join('');
                }
                var _end = function(tag) {
                    return '</' + tag + '>';
                }

                var _wrap = function(tag, text, options) {
                    return text ? _star(tag, options) + text + _end(tag) : _star(tag, options);
                }

                var escape = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#x27;'
                }
                var _escape = function() {
                    var keys = _.keys(escape)
                    var reg = new RegExp('[' + keys.join('') + ']', 'g');
                    return this.replace(reg, function(macth) {
                        return escape[macth]
                    })
                }

                var _replace = function(tag, reg) {
                    var self = this;
                    return this.replace(reg, function(match, text, link, link2) {
                        switch (tag) {
                            case "ref":
                                return "";
                                break;
                            case "marklink":
                                link = link || text
                                var reg = new RegExp('\\[' + link + '\\]\:(.*?)\\r?\\n', 'i');
                                var link2 = self.match(reg)[1];
                                self = self.replace(reg, "");
                                return _wrap("a", text, link2);
                                break
                            case 'img':
                                return _wrap(tag, null, { alt: text, src: link })
                                break;
                            case 'a':
                                return _wrap(tag, text || match, { href: link || link2 })
                                break;
                                // case 'link':
                                //     return _wrap("a", text, { href: text })
                                //     break;
                            case 'br':
                            case 'hr':
                                return _wrap(tag);
                                break;
                            case "blockquote":
                                match = _escape.call(match);
                                return _wrap(tag, match);
                                break;
                            case 'ul':
                                //\d+[.)][\n ]
                                // match = _replace.call(match, "childul", /(\s+[\*-]\s(.+)[\r?\n|$])+/g);

                                // match = match.replace(/(\s{2}-\s(.+)(?:\n|$))+/g, function(match) {
                                //     return _wrap(tag, match)
                                // })

                                match = _replace.call(match, "li", /[\*-]\s([\s\S]+?)(?:\n|$)/g);
                                // match = _replace.call(match, "li", /[\*-]\s([\s\S]+?)[\r?\n|$]/g); //递归
                                return _wrap(tag, match)
                                break;
                            case 'ol':
                                match = _replace.call(match, "li", /[(?:\d+\.)|\+]\s(.+)\r?\n/g); //递归
                                return _wrap(tag, match)
                                break;
                                // case 'ol':
                                //     match = _replace.call(match, "li", /\+\s(.+)\r?\n/g); //递归
                                //     return _wrap(tag, match)
                                //     break;
                                // case 'ol2':
                                //     match = _replace.call(match, "li", /\d\.\s(.+)\r?\n/g); //递归
                                //     return _wrap("ol", match)
                                //     break;
                            case "tr":
                                var tds = text.split("|").join("</td><td>");
                                tds = _wrap("td", tds);
                                return _wrap("tr", tds);
                                break;
                            case "table":
                                match = match.replace(/\|.*[\-]{3,}.*\|[\r?\n]/g, "");
                                var trs = _replace.call(match, "tr", /\|(.+)\|[\r?\n]/g); //递归
                                return _wrap(tag, trs);
                                break;
                            case "h1":
                                return _wrap(tag, text);
                                break;
                            case "i":
                                return _wrap(tag, text);
                                break;
                            case "li":
                                return _wrap(tag, text);
                                break;
                            case "code":
                                text = _escape.call(text);
                                return _wrap(tag, text);
                                break;

                            default:
                                return _wrap(tag, text);
                                break;
                        }

                    })

                }

                var reg, tag;
                for (var i = 0, len = regs.length; i < len; i++) {
                    reg = regs[i].reg;
                    tag = regs[i].tag;
                    tpl = _replace.call(tpl, tag, reg);
                }
                return _wrap("article", tpl, { class: "markdown-body entry-content" });
            },
            // html: function(str) { //htmlspecialchars
            //     // var reg_http=/(((https?):\/\/)?)(((www\.)?([a-zA-Z0-9\-\.\_]+(\.[a-zA-Z]{2,4})))/;
            //     // var reg_http=/^(((https?):\/\/)?)(((www\.)?([a-zA-Z0-9\-\.\_]+(\.[a-zA-Z]{2,4})))/
            //     // var ip=/((25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3})/
            //     // var options=/(\/[a-zA-Z0-9\_\-\s\.\/\?\%\#\&\=]*)?/
            //     // var r=/((?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}))(:(6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{0,3}))?/

            //     if (/^(((https?):\/\/)?)(((www\.)?([a-zA-Z0-9\-\.\_]+(\.[a-zA-Z]{2,4})))|((25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3})|((?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}))(:(6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{0,3}))?(\/[a-zA-Z0-9\_\-\s\.\/\?\%\#\&\=]*)?$/g.test(str)) {
            //         return '<div class="link" style="color:#6D6DB7;">' + str + '</div>'
            //     } else {
            //         return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br/>');
            //     }
            // },
            isShow: function(elem) {
                //display:none  elem.offsetWidth ==0  不占空间
                //opacity:0 elem.offsetWidth>0  占空间
                elem = _.isElement(elem) ? elem : _.query(elem);
                return elem.offsetWidth > 0 || elem.offsetHeight > 0;
            },
            isHide: function(elem) {
                elem = _.isElement(elem) ? elem : _.query(elem);
                return elem.offsetWidth <= 0 && elem.offsetHeight <= 0;
            },
            hasClass: function(cls) {
                var elem = this;
                if (_.isJQuery(elem)) {
                    elem = elem.get(0);
                }
                if (_.isElement(elem)) {
                    return _.contains(elem.className.split(" "), cls);
                } else {
                    return false;
                }

            },
            addClass: function(cls) {
                var elem = this;
                var clsArr = slice.call(arguments);
                if (clsArr.length == 1 && cls) {
                    clsArr = cls.split(" ");
                }

                var _addClass = function() {
                    var elem = this;
                    if (_.isString(elem)) {
                        elem = _.query(elem);
                    }

                    if (_.isElement(elem)) {
                        elem.className = _.uniq(elem.className.split(" ").concat(clsArr)).join(" "); //允许一次加多个样式
                    } else if (_.isJQuery(elem)) {
                        elem.addClass(cls); //兼容jquery
                    } else if (_.isArray(elem)) {
                        _.each(elem, function(item) {
                            _addClass.call(item); //递归调用
                        });
                    }
                }
                _addClass.call(elem);
                if (_.isArray(elem)) {
                    var len = elem.length;
                    if (len == 0) {
                        // return null;
                        return [];
                    } else if (len == 1) {
                        elem = elem[0];
                    }
                }
                return elem;
            },
            removeClass: function(cls) {
                var elem = this;
                var clsArr = slice.call(arguments);
                if (clsArr.length == 1 && cls) {
                    clsArr = cls.split(" ");
                }
                if (clsArr.length > 1) {
                    clsArr.forEach(function(t) {
                        _.removeClass.call(elem, t)
                    })
                }
                var _removeClass = function() {
                    var elem = this;
                    if (_.isString(elem)) {
                        elem = _.query(elem);
                    }

                    if (_.isElement(elem)) {
                        if (elem.hasClass(cls)) {
                            var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
                            elem.className = elem.className.replace(reg, ' ');
                        }
                    } else if (_.isJQuery(elem)) {
                        elem.removeClass(cls); //兼容jquery
                    } else if (_.isArray(elem)) {
                        _.each(elem, function(item) {
                            _removeClass.call(item, cls); //递归调用
                        });
                    }
                }
                _removeClass.call(elem);
                if (_.isArray(elem)) {
                    var len = elem.length;
                    if (len == 0) {
                        return [];
                    } else if (len == 1) {
                        elem = elem[0];
                    }
                }
                return elem;
            },
            slice: function() {
                var args = slice.call(arguments),
                    len = args.length;
                return len == 0 ? null : len == 1 ? args[0] : args;
            },
            //判断是否有属性
            hasAttr: function(elem, attr) {
                if (_.isElement(elem)) {
                    return !_.isNull(elem.getAttribute(attr));
                } else if (_.isJQuery(elem)) {
                    return typeof(elem.attr(attr)) != "undefined";
                } else if (_.isString(elem)) {
                    elem = _.query(elem);
                    return _.hasAttr(elem, attr)
                } else {
                    return false;
                }
            },

            //contenteditable是非标准的编辑，光标不能自动跳入，需要用脚本控制
            focus: function(editor) {
                editor.onfocus = function() {
                    window.setTimeout(function() {
                        var sel, range;
                        try {
                            if (window.getSelection && document.createRange) {
                                range = document.createRange();
                                range.selectNodeContents(editor);
                                range.collapse(true);
                                range.setEnd(editor, editor.childNodes.length);
                                range.setStart(editor, editor.childNodes.length);
                                sel = window.getSelection();
                                sel.removeAllRanges();
                                sel.addRange(range);
                            } else if (document.body.createTextRange) {
                                range = document.body.createTextRange();
                                range.moveToElementText(editor);
                                range.collapse(true);
                                range.select();
                            }
                        } catch (e) {
                            console.log(e)
                        }
                    }, 1);
                }
                editor.focus();
            },
            // objectName: function(obj) {
            //     // return obj.prototype.constructor? obj.prototype.constructor.name : obj.__proto__.constructor.name
            // },

            type: function(o) {
                // handle null in old IE
                if (o === null) {
                    return 'null';
                }
                // handle DOM elements
                var s = toString.call(o);
                var t = s.match(/\[object (.*?)\]/)[1].toLowerCase();
                // handle NaN and Infinity
                if (t === 'number') {
                    if (isNaN(o)) {
                        return 'nan';
                    }
                    if (!isFinite(o)) {
                        return 'infinity';
                    }
                }
                return t;
            },
            isElement: function(o) {
                if (o && (o.nodeType === 1 || o.nodeType === 9)) {
                    return true
                }
                return false;
            },
            isDocument: function(o) {
                if (o && o.nodeName && o.nodeType === 9) { //&& o.nodeName == "#document"
                    return true;
                }
                return false;
            },
            isJQuery: function(o) {
                if (o) {
                    return !!(o.jquery);
                }
                return false;
            },

            //for in 可以遍历扩展原型  hasOwnProperty只会原生的
            has: function(obj, key) {
                var ks = key.split(".");
                var len = ks.length;
                var _has = function(k) {
                    return Object.prototype.hasOwnProperty.call(this, k)
                }
                if (len == 1) {
                    return _has.call(obj, key);
                } else {
                    var o = obj;
                    for (var i = 0; i < len; i++) {
                        var k = ks.shift().trim();
                        if (_has.call(o, k)) {
                            try {
                                o = o[k];
                            } catch (e) {
                                console.log(o, k);
                                console.log(e);
                                return false;
                            }
                        } else {
                            return false;
                        }

                    }
                    return true;
                }

            },
            keys: function(obj) {
                if (!_.isObject(obj)) return [];
                if (Object.keys) return Object.keys(obj);
                var keys = [];
                for (var key in obj)
                    if (_.has(obj, key)) keys.push(key);
                return keys;


                // var names = Object.getOwnPropertyNames(obj);
                // return names;
                // for (var i = 0; i < names.length; i++) { 
                //     // var prop = names[i]; document.write(prop + ': ' + obj[prop]); 
                //     //  document.write(newLine); 
                // } 
            },

            each: function(obj, iterator, context) {
                if (obj == null) return obj;
                if (nativeForEach && obj.forEach === nativeForEach) {
                    obj.forEach(iterator, context);
                } else if (obj.length === +obj.length) {
                    for (var i = 0, length = obj.length; i < length; i++) {
                        if (iterator.call(context, obj[i], i, obj) === {}) return;
                    }
                } else {
                    var keys = _.keys(obj);
                    for (var i = 0, length = keys.length; i < length; i++) {
                        if (iterator.call(context, obj[keys[i]], keys[i], obj) === {}) return;
                    }
                }
                return obj;
            },

            any: function(obj, predicate, context) {
                predicate || (predicate = function(value) {
                    return value;
                });
                var result = false;
                if (obj == null) return result;
                if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
                _.each(obj, function(value, index, list) {
                    if (result || (result = predicate.call(context, value, index, list))) return {};
                });
                return !!result;
            },


            contains: function(obj, target) {
                if (obj == null) return false;
                if (obj == target) return true; //
                if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
                return _.any(obj, function(value) {
                    return value === target;
                });
            },



            size: function(obj) {
                if (obj == null) return 0;
                return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
            },

            filter: function(obj, predicate, context) {
                var results = [];
                if (obj == null) return results;
                if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
                _.each(obj, function(value, index, list) {
                    if (predicate.call(context, value, index, list)) results.push(value);
                });
                return results;
            },
            max: function(array) {
                var args = slice.call(arguments),
                    len = args.length;
                if (len > 1) {
                    array = args;
                }
                //多维数组转一维
                var ta = _.isArray(array) ? array.join(",").split(",") : array.split(",");
                //去非数字
                for (var i = 0; i < ta.length; i++) {
                    // if (!_.isNumber(ta[i])) {
                    if (ta[i] == "") {
                        ta.splice(i, 1);
                        i--;
                    }
                }
                if (ta == []) return 0;
                return Math.max.apply(Math, ta);
            },
            min: function(array) {
                var args = slice.call(arguments),
                    len = args.length;
                if (len > 1) {
                    array = args;
                }
                //多维数组转一维
                var ta = _.isArray(array) ? array.join(",").split(",") : array.split(",");
                //去非数字
                for (var i = 0; i < ta.length; i++) {
                    // if (!_.isNumber(ta[i])) {
                    if (ta[i] == "") {
                        ta.splice(i, 1);
                        i--;
                    }
                }
                if (ta == []) return 0;
                return Math.min.apply(Math, ta);
            },

            extend: function(obj) {
                _.each(slice.call(arguments, 1), function(source) {
                    if (source) {
                        for (var prop in source) {
                            obj[prop] = source[prop];
                        }
                    }
                });
                return obj;
            },

            // define: function(obj, key) {
            //     Object.defineProperty(obj, key, {
            //         set: function(value) {
            //             //  针对 o.key = value 的set方法
            //             if (!datas[key]) {
            //                 obj.size++
            //             }
            //             datas[key] = value
            //         },
            //         get: function() {
            //             //  获取当前数据，如果当前数据有值，返回值并将当前属性值设置为undefined
            //             var res = undefined
            //             if (typeof datas[key] !== undefined) {
            //                 res = datas[key]
            //                 obj.size--
            //                     datas[key] = undefined
            //             }
            //             return res
            //         }
            //     })
            // },

            //扩展原型  函数  extend prototype
            extproto: function(obj) {
                _.each(slice.call(arguments, 1), function(source) {
                    if (source) {
                        for (var prop in source) {
                            if (_.isObject(source[prop])) {
                                Object.defineProperty(obj, prop, source[prop]);
                            } else if (_.isFunction(source[prop])) {
                                if (!obj.hasOwnProperty(prop)) {
                                    obj[prop] = source[prop];
                                    //禁止被for in 枚举
                                    var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
                                    descriptor.enumerable = false;
                                    Object.defineProperty(obj, prop, descriptor);
                                } else {
                                    console.log(obj, "obj hasOwnProperty " + prop)
                                }
                            } else {
                                if (!obj.hasOwnProperty(prop)) {
                                    obj[prop] = source[prop];
                                }
                            }
                        }
                    }
                });
                return obj;
            },
            clone: function(obj) {
                if (!_.isObject(obj)) return obj;
                return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
            },

            // Invert the keys and values of an object. The values must be serializable.
            invert: function(obj) {
                var result = {};
                var keys = _.keys(obj);
                for (var i = 0, length = keys.length; i < length; i++) {
                    result[obj[keys[i]]] = keys[i];
                }
                return result;
            }

        };

        // _.upperCaseFirstAlphabet=function(str){
        //     return str.replace(/[a-z]/,function(m){
        //         return m.toUpperCase();
        //     })
        // }

        //show hide

        [{ "key": "hide", "reverse": "show" },
            { "key": "active", "reverse": "passive" },
            { "key": "disabled", "reverse": "available" },
            { "key": "fadeout", "reverse": "fadein", "type": "animate" },
            { "key": "fadeoutup", "reverse": "fadeindown", "type": "animate" },
            { "key": "fadeinup", "reverse": "fadeoutdown", "type": "animate" },
            { "key": "fadeoutleft", "reverse": "fadeinright", "type": "animate" },
            { "key": "fadeinleft", "reverse": "fadeoutright", "type": "animate" }
        ].forEach(function(t) {
            _[t.key] = function() {
                var elem = slice.call(arguments);
                if (t.type == "animate") {
                    _.removeClass.call(elem, t.reverse, "hide")
                }
                return _.addClass.call(elem, t.key);
            };

            _[t.reverse] = function() {
                var elem = slice.call(arguments);
                if (t.type == "animate") {
                    _.addClass.call(elem, t.reverse);
                    return _.removeClass.call(elem, t.key, "hide");
                }
                return _.removeClass.call(elem, t.key);
            };

            // _['is'+_.upperCaseFirstAlphabet(t.key)]=function(){
            //     var elem = slice.call(arguments);
            //     return _.hasAttr.call(elem,t.key);
            // }

        });

        // _.animate=function(type,elem){
        //      _.removeClass.call(elem, "hide")
        //      return _.addClass.call(elem, type);
        // }


        //去掉'Element' 'Object'
        //增加NodeList Arguments Window touchevent MouseEvent
        ['Null', 'Undefined', 'Array', 'String', 'Number',
            'Boolean', 'Function', 'RegExp', 'NaN', 'Infinite',
            'NodeList', 'Arguments', 'Window', 'TouchEvent', "MouseEvent"
        ].forEach(function(t) {
            _['is' + t] = function(o) {
                return _.type(o) === t.toLowerCase();
            };
        });
        // [object HTMLDivElement] is Object
        _.isObject = function(o) {
            if (_.isElement(o)) {
                return true;
            }
            return _.type(o) === "object";
        };
        _.isEmpty = function(obj) {
            if (obj == null) return true;
            if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
            if (_.isElement(obj)) return _.size(obj) == 0;
            for (var key in obj)
                if (_.has(obj, key)) return false;
            return true;
        };


        _.uniq = _.unique = function(array, isSorted, iterator, context) {
            if (_.isFunction(isSorted)) {
                context = iterator;
                iterator = isSorted;
                isSorted = false;
            }
            var initial = iterator ? _.map(array, iterator, context) : array;
            var results = [];
            var seen = [];
            _.each(initial, function(value, index) {
                if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
                    seen.push(value);
                    results.push(array[index]);
                }
            });
            return results;
        };
        _.identity = function(value) {
            return value;
        };
        _.every = _.all = function(obj, predicate, context) {
            predicate || (predicate = _.identity);
            var result = true;
            if (obj == null) return result;
            if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
            _.each(obj, function(value, index, list) {
                if (!(result = result && predicate.call(context, value, index, list))) return breaker;
            });
            return !!result;
        };

        _.intersection = function(array) {
            var rest = slice.call(arguments, 1);
            return _.filter(_.uniq(array), function(item) {
                return _.every(rest, function(other) {
                    return _.contains(other, item);
                });
            });
        };

        _.difference = function(array) {
            var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
            return _.filter(array, function(value) {
                return !_.contains(rest, value);
            });
        };
        _.without = function(array) {
            return _.difference(array, slice.call(arguments, 1));
        };
        _.map = _.collect = function(obj, iterator, context) {
            var results = [];
            if (obj == null) return results;
            if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
            _.each(obj, function(value, index, list) {
                results.push(iterator.call(context, value, index, list));
            });
            return results;
        };
        _.property = function(key) {
            return function(obj) {
                return obj[key];
            };
        };
        _.pluck = function(obj, key) {
            return _.map(obj, _.property(key));
        };

        _.indexOf = function(str1, str2) {
            if (_.isUndefined(str1) || _.isUndefined(str2)) {
                return -1;
            } else {
                return str1.toLowerCase().indexOf(str2.toLowerCase())
            }
        }

        // Internal implementation of a recursive `flatten` function.
        var flatten = function(input, shallow, output) {
            if (shallow && _.every(input, _.isArray)) {
                return concat.apply(output, input);
            }
            _.each(input, function(value) {
                if (_.isArray(value) || _.isArguments(value)) {
                    shallow ? push.apply(output, value) : flatten(value, shallow, output);
                } else {
                    output.push(value);
                }
            });
            return output;
        };

        // Flatten out an array, either recursively (by default), or just one level.
        _.flatten = function(array, shallow) {
            return flatten(array, shallow, []);
        };

        _.getVal = function(data, name) {
            var val = "";
            var nameArr = name.split("."),
                len = nameArr.length;
            if (_.isObject(data)) {
                if (len == 1) {
                    val = data[name];
                } else {
                    val = data[nameArr.shift()];
                    len = len - 1;
                    if (_.isObject(val)) {
                        for (var i = 0; i < len; i++) {
                            val = val[nameArr[i]];
                            if (_.isUndefined(val)) {
                                val = "";
                                return "";
                            }
                        }
                    }
                }
            } else if (_.isString(data) || _.isNumber(data)) {
                if (name == "text") {
                    val = data;
                }
            }
            return val;
        }

        _.$ = _.query;

        // Array.intersect = function(a, b) {
        //     return a.uniq().each(function(o) {
        //         return b.contains(o) ? o : null
        //     });
        // };



        // List of HTML entities for escaping.
        var entityMap = {
            escape: {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;'
            }
        };
        entityMap.unescape = _.invert(entityMap.escape);

        // Regexes containing the keys and values listed immediately above.
        var entityRegexes = {
            escape: new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
            unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
        };

        // Functions for escaping and unescaping strings to/from HTML interpolation.
        _.each(['escape', 'unescape'], function(method) {
            _[method] = function(string) {
                if (string == null) return '';
                return ('' + string).replace(entityRegexes[method], function(match) {
                    return entityMap[method][match];
                });
            };
        });


        /**
         * 。。。。
         * 
         * @memberOf string
         * @param {Object} obj 要转换成查询字符串的对象
         * @return {String} 返回转换后的查询字符串
         */
        _.toQueryPair = function(key, value) {
            return encodeURIComponent(String(key)) + "=" + encodeURIComponent(String(value));
        };

        /**
         * 。。。。
         * 
         * @memberOf string
         * @param {Object} obj 要转换成查询字符串的对象
         * @return {String} 返回转换后的查询字符串
         */
        _.toQueryString = function(obj) {
            var result = [];
            for (var key in obj) {
                result.push(_.toQueryPair(key, obj[key]));
            }
            return result.join("&");
        };



        _.ajax = function(uri) {

            var xmlHttp = false;
            var done = false;
            var invokeTimes = 0;
            var type = type || 'GET';
            var option = {
                method: "GET",
                data: null,
                arguments: null,
                onSuccess: function() {},
                onError: function() {},
                onComplete: function() {},
                isAsync: true,
                timeout: 30000,
                contentType: null,
                // type: "xml"  //resultType
                dataType: "json"
            };


            var args = slice.call(arguments),
                len = args.length;
            if (len >= 2) {
                if (_.isFunction(args[1])) {
                    option = _.extend(option, {
                        onSuccess: args[1]
                    })
                } else if (_.isObject(args[1])) {
                    option = _.extend(option, args[1])
                    if (_.isObject(option.data)) {
                        option.data = _.toQueryString(option.data);
                    }
                }

            }

            if (len >= 3) {
                if (_.isFunction(args[2])) {
                    option = _.extend(option, {
                        onError: args[2]
                    })
                }
            }

            function createXmlHttpRequest() {
                try {
                    xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
                } catch (e) {
                    try {
                        xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
                    } catch (e2) {
                        xmlHttp = false;
                    }
                }
                if (!xmlHttp && typeof XMLHttpRequest != "udefined") {
                    xmlHttp = new XMLHttpRequest();
                }
            }

            function sendXmlHttpRequest() {
                createXmlHttpRequest();
                if (xmlHttp) {
                    try {

                        // xmlHttp.open(type, uri, true); ////false表示同步模式，true异步模式GET"GET"
                        // // xmlHttp.onreadyStateChange = handleStateChange; //chorme下未被调用，使用watchStateChange
                        // xmlHttp.onreadystatechange = handleStateChange;
                        // xmlHttp.send(null);
                        xmlHttp.onreadystatechange = handleStateChange;

                        if (option.method === "GET") {
                            if (option.data) {
                                uri += (uri.indexOf("?") > -1 ? "&" : "?") + option.data;
                                option.data = null;
                            }
                            xmlHttp.open("GET", uri, option.isAsync);
                            xmlHttp.setRequestHeader("Content-Type", option.contentType || "text/plain;charset=UTF-8");
                            xmlHttp.send();
                        } else if (option.method === "POST") {
                            xmlHttp.open("POST", uri, option.isAsync);
                            xmlHttp.setRequestHeader("Content-Type", option.contentType || "application/x-www-form-urlencoded;charset=UTF-8");
                            xmlHttp.send(option.data);
                        } else {
                            xmlHttp.open(option.method, uri, option.isAsync);
                            xmlHttp.send();
                        }

                    } catch (e) {
                        console.log(e)
                    }

                }
            }

            //回调函数 
            function handleStateChange() {
                if (done) {
                    return true;
                }
                var o = {};
                var content = o.responseText = xmlHttp.responseText;
                o.responseXML = xmlHttp.responseXML;
                o.data = option.data;
                o.status = xmlHttp.status;
                o.uri = uri;
                o.arguments = option.arguments;
                if (option.dataType === 'json') {
                    try {
                        content = o.responseJSON = JSON.parse(xmlHttp.responseText);
                    } catch (e) {}
                }
                if (xmlHttp.readyState == 4) {
                    switch (xmlHttp.status) {
                        case 200:
                            option.onSuccess.call(content, content);
                            break;
                        default:
                            var xmlHttpStatus = {
                                400: "错误的请求！\nError Code:400!",
                                403: "拒绝请求！\nError Code:403!",
                                404: "请求地址不存在！\nError Code:404!",
                                500: "内部错误！\nError Code:500!",
                                503: "服务不可用！\nError Code:503!"
                            }
                            var st = xmlHttpStatus[xmlHttp.status] ? xmlHttpStatus[xmlHttp.status] : "请求返回异常！\nError Code:" + xmlHttp.status;
                            console.log(st);
                            option.onError(o);
                            break;
                    }
                    return done = true;
                } else {
                    option.onError(o);
                    // There are five possible values
                    // for readyState:
                    var readyState = {
                        0: 'Uninitialized', //: The object has been created but the open() method hasn’ t been called.
                        1: 'Loading', //The open() method has been called but the request hasn’ t been sent.
                        2: 'Loaded', //The request has been sent.
                        3: 'Interactive', //A partial response has been received.
                        4: 'Complete', //All data has been received and the connection has been closed.
                    };
                    console.log(uri + " (" + readyState[xmlHttp.readyState] + ")");
                    return false;
                }
                xmlHttp = null;
            }

            var watchStateChange = function() {
                if (done) {
                    return;
                }
                if (invokeTimes > 5) { //最多调用5次，超时
                    console.log("请求超时");
                    return;
                }
                invokeTimes++;
                done = handleStateChange();
                setTimeout(watchStateChange, 10);
            };

            sendXmlHttpRequest();

            //延迟监控
            setTimeout(watchStateChange, 15);
        }

        _.get = function(url, callback) {
            _.ajax(url, callback, "GET");
        }

        _.post = function(url, callback) {
            _.ajax(url, callback, "POST");
        }

        _.loading = function(loadEl, callback, animate) {
            if (_.isString(loadEl)) {
                loadEl = _.query(loadEl);
            }
            if (_.isElement(loadEl)) {
                var loadArr = ['~oo~', '^oo^', '^oo~', '~oo^'];
                var loadAnimationTimeout = false;
                var loadAnimation = function() {
                    if (loadAnimationTimeout) {
                        return;
                    }
                    setTimeout(function() {
                        loadEl.query(".tip").text(loadArr.random()); //"数据加载中 " + 
                        loadAnimation();
                    }, 100)
                };
                animate && loadAnimation();

                setTimeout(function() {
                    loadAnimationTimeout = true;
                    loadEl.hide();
                    callback && callback();
                }, 1000);
            }
        };


        _.loadFile = function(el, success, error) {
            var $file = el.query("data-file".brackets())

            var _success = function(elem, result) {
                if (_.isFunction(success)) {
                    success.call(elem, elem, result);
                } else {
                    elem.html(result);
                }
            };

            var _error = function(elem, result) {
                if (_.isFunction(error)) {
                    error.call(elem, elem, result);
                }
            }

            if (_.isElement($file)) {
                _.ajax($file.attr("data-file"), function(result) {
                    _success($file, result);
                }, function(result) {
                    _error($file, result)
                });
            } else if (_.isArray($file)) {
                $file.forEach(function(t) {
                    _.ajax(t.attr("data-file"), function(result) {
                        _success(t, result);
                    }, function(result) {
                        _error(t, result)
                    });
                })
            }
        }

        _.updateAfterImgLoad = function(id, fn) {
            var self = this;
            var $dom = _.query("#" + id); //$("#" + id);
            var $img = $dom.query("img");

            var t_img; // 定时器
            var isLoad = true; // 控制变量
            // 判断图片加载的函数
            function isImgLoad(callback) {
                $img.each(function() {
                    // 找到为0就将isLoad设为false，并退出each
                    if (this.height === 0) {
                        isLoad = false;
                        return false;
                    }
                });
                // 为true，没有发现为0的。加载完毕
                if (isLoad) {
                    clearTimeout(t_img); // 清除定时器
                    // 回调函数
                    callback();
                    // 为false，因为找到了没有加载完成的图，将调用定时器递归
                } else {
                    isLoad = true;
                    t_img = setTimeout(function() {
                        isImgLoad(callback); // 递归扫描
                    }, 500);
                }
            }


            if ($img && $img.length > 0) { //图片延迟加载时间
                isImgLoad(function() {
                    // 加载完成
                    // self.update(id);
                    fn && fn();
                });
            }
        };


        //兼容  替代函数
        _.polyfill = function(obj, arr, fn) {
            for (var i = 0, len = arr.length; i < len; i++) {
                var f = obj[arr[i]];
                if (_.isFunction(f)) {
                    if (i == 0) {
                        return f;
                    } else {
                        return obj[arr[0]] = f;
                    }
                }
            }
            return obj[arr[0]] = fn;
        }


        // _.polyfill(Element.prototype, ['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'], function(s) {
        //     // return [].indexOf.call(document.querySelectorAll(s), this) !== -1;
        //     var matches = document.querySelectorAll(s), //(this.document || this.ownerDocument)
        //         i = matches.length;
        //     while (--i >= 0 && matches.item(i) !== this) {}
        //     return i > -1;
        // });


        _.selectorMatches = function(el, selector) {
            var p = Element.prototype;
            var f = p.matches || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector ||
                function(s) { return [].slice.call(document.querySelectorAll(s)).indexOf(this) !== -1; };
            return f.call(el, selector);
        }

        _.closest = function(selector) {
            var el = this;
            while (el) {
                if (el && _.selectorMatches(el, selector)) { //parent.matches(selector)
                    return el;
                }
                el = el.parentElement; //parentNode
            }
            return [];
        }

        //原型扩展
        var obj_prototype = {
            //四则运算
            cmd: function(str) { //在object 原型上扩展，会被in 枚举
                if (!_.isString(str)) {
                    console.log("object.cmd need a string argument")
                    return "";
                }
                var self = this,
                    symbol = str.match(reg_operation_symbol),
                    ps = [],
                    _cmd = function(str) {
                        if (symbol.length == 0) {
                            ps.push("self." + str);
                            return;
                        }
                        var first = symbol.shift();
                        var pos = str.indexOf(first);
                        var sub = str.substring(0, pos).trim();
                        if (_.has(self, sub)) {
                            ps.push("self." + sub + first);
                        } else {
                            ps.push(sub + first);
                        }
                        var surplus = str.substring(pos + first.length);
                        _cmd(surplus);
                    }
                _cmd(str);
                return eval(ps.join(""));
            }
        };

        //浮点运算
        var num_prototype = {
            isEqual: function(number, digits) {
                digits = digits == undefined ? 10 : digits; // 默认精度为10
                return this.toFixed(digits) === number.toFixed(digits);
            },
            add: function(arg) {
                var r1, r2, m;
                try {
                    r1 = arg.toString().split(".")[1].length
                } catch (e) {
                    r1 = 0
                }
                try {
                    r2 = this.toString().split(".")[1].length
                } catch (e) {
                    r2 = 0
                }
                m = Math.pow(10, Math.max(r1, r2));
                // var result = (arg * m + this * m) / m

                var result = Math.round(arg * m + this * m) / m;

                // var result = (arg.mul(m) + this.mul(m)).div(m);

                result.isInfinity(function() {
                    console.log(r1 + " " + r2 + " " + " " + this + " " + arg);
                });

                // if (result.toString().indexOf(".") > 0 && result.toString().split(".")[1].length > 5) {
                //     console.log("result:" + result);
                //     console.log(arg, this);
                //     // console.log(result.sub(Number(data[i - j][2])));
                // }
                return result;
            },

            //减法  
            sub: function(arg) {
                var r1, r2, m, n;
                try {
                    r1 = this.toString().split(".")[1].length
                } catch (e) {
                    r1 = 0
                }
                try {
                    r2 = arg.toString().split(".")[1].length
                } catch (e) {
                    r2 = 0
                }
                m = Math.pow(10, Math.max(r1, r2));
                //动态控制精度长度  
                n = (r1 >= r2) ? r1 : r2;
                return ((this * m - arg * m) / m).toFixed(n);
            },

            //乘法  
            mul: function(arg) {
                var m = 0,
                    s1 = arg.toString(),
                    s2 = this.toString();
                try {
                    m += s1.split(".")[1].length
                } catch (e) {}
                try {
                    m += s2.split(".")[1].length
                } catch (e) {}
                return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
            },


            //除法  
            div: function(arg) {
                var t1 = 0,
                    t2 = 0,
                    r1, r2, result, m;
                try {
                    t1 = this.toString().split(".")[1].length
                } catch (e) {}
                try {
                    t2 = arg.toString().split(".")[1].length
                } catch (e) {}
                // with(Math) {
                //整数相除
                if (t2 == 0 && t1 == 0) {
                    result = (this / arg);

                } else {
                    r1 = Number(this.toString().replace(".", ""));
                    r2 = Number(arg.toString().replace(".", ""));

                    // result =Math.round(r1 / r2)* m;

                    if (t1 < t2) {
                        m = Math.pow(10, t2 - t1);
                        result = (r1 / r2) * m;
                    } else if (t1 > t2) {
                        m = Math.pow(10, t1 - t2);
                        result = Math.round(r1 / r2) / m;
                    } else {
                        result = (r1 / r2);

                    }

                }


                result.isInfinity(function() {
                    // console.log((r1 / r2),(t2 - t1))
                    console.log(r1 + " " + r2 + " " + (t2 - t1) + " " + this + " " + arg);
                });

                // if(_.isNaN(result)){
                //     console.log(r1 + " " + r2 + " " + (t2 - t1) + " " + this);
                // }

                return result;
                // }
            },
            isInfinity: function(callback) {
                var fn = function() {
                    if (this.toString().indexOf(".") > 0 && this.toString().split(".")[1].length > 5) {
                        callback && callback.call(this);
                        return true;
                    }
                    return false;
                }
                return fn.call(this);
            }
        };

        //原型
        var str_prototype = {
            // trim: function() {
            //     return this.replace(/(^\s+)|(\s+$)/g, "");
            // },
            pound: function() {
                return "#" + this;
            },
            brackets: function(ele) {

                if (!ele) {
                    var es = this.split(",");
                    return "[" + es.join("],[") + "]";

                    // return "[" + this + "]";
                } else {
                    var id;
                    if (_.isElement(ele)) {
                        _.autoid(ele);
                        id = ele.id;
                    } else if (_.isString(ele)) {
                        id = ele;
                    }
                    // return "#" + id + "" + this.brackets() + "," + "#" + id + " " + this.brackets();
                    var es = this.split(",");
                    return "#" + id + "[" + es.join("],#" + id + "[") + "]" + "," + "#" + id + " [" + es.join("],#" + id + " [") + "]";
                }

            },
            // console.log('hihih {0}, ,{2}'.format('dfasda', '34324343','dffds34324'));
            format: function() {
                var str = this;
                for (var i = 0, j = arguments.length; i < j; i++) {
                    // str = str.replace(new RegExp('\\{' + i + '\\}', 'g'), arguments[i]);
                    str = str.replace(/{.*?}/, arguments[i]);
                }
                return str;
            },



        };

        var dat_prototype = {
            // var _ = _;
            // 对Date的扩展，将 Date 转化为指定格式的String 
            // 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符， 
            // 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 
            // 例子： 
            // (new Date()).format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 
            // (new Date()).format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
            format: function(fmt) { //author: meizz 
                var $1, o = {
                    "M+": this.getMonth() + 1, //月份 
                    "d+|D+": this.getDate(), //日 
                    "h+|H+": this.getHours(), //小时 
                    "m+": this.getMinutes(), //分 
                    "s+": this.getSeconds(), //秒 
                    "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
                    "S": this.getMilliseconds() //毫秒 
                };
                var key, value;
                if (/(y+|Y+)/.test(fmt))
                    $1 = RegExp.$1,
                    fmt = fmt.replace($1, (this.getFullYear() + "").substr(4 - $1.length));
                for (var k in o) {
                    if (new RegExp("(" + k + ")").test(fmt)) {
                        $1 = RegExp.$1,
                            // value = String(""+o[key]),
                            // value = $1.length == 1 ? value : ("00" + value).substr(value.length),
                            // fmt = fmt.replace($1, value);
                            fmt = fmt.replace($1, ($1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                    }
                }
                return fmt;
            }
        };
        var ele_prototype = {
            length: {
                value: 1,
                writable: false
            },
            //支持链式
            query: function() {
                return _.query.apply(this, arguments);
            },
            //兼容jquery  常用方法
            attr: function(key, value) {
                if (value) {
                    this.setAttribute(key, value);
                    return this;
                }
                return this.getAttribute(key);
            },
            hasAttr: function(key) {
                // return _.hasAttr(this,key);
                return !_.isNull(this.getAttribute(key));
            },
            remove: function() {
                if (this.parentNode) {
                    this.parentNode.removeChild(this)
                }
            },
            empty: function() {
                var elem,
                    i = 0;
                for (;
                    (elem = this[i]) != null; i++) {
                    if (elem.nodeType === 1) {
                        this.removeChild(elem)
                        // Prevent memory leaks
                        // jQuery.cleanData(getAll(elem, false));
                        // Remove any remaining nodes
                        elem.textContent = "";
                    }
                }
                return this;
            },
            hide: function() {
                return _.hide(this);
            },
            show: function() {
                return _.show(this);
            },
            active: function() {
                return _.active(this);
            },
            passive: function() {
                return _.passive(this);
            },
            removeAttr: function(key) {
                var self = this,
                    keys = key.split(","),
                    len = keys.length;
                if (len == 1) {
                    self.removeAttribute(key);
                } else {
                    keys.forEach(function(t) {
                        self.removeAttribute(t);
                    });
                }
                return self;
            },
            hasClass: function(cls) {
                return _.hasClass.apply(this, arguments);
            },
            addClass: function(cls) {
                return _.addClass.apply(this, arguments);
            },
            removeClass: function(cls) {
                return _.removeClass.apply(this, arguments);
            },
            html: function(str) {
                var args = slice.call(arguments),
                    len = args.length;
                if (len == 0) {
                    return this.innerHTML;
                } else {
                    this.innerHTML = args[0];
                    return this;
                }

                // if (_.isUndefined(str)) {
                //     return this.innerHTML;
                // } else {
                //     this.innerHTML = str;
                //     return this;
                // }
            },
            //冲突：HTMLScriptElement.text  是一个属性  ，使用_.text代替
            text: function(str) {
                if (str) {
                    this.innerText = str;
                }
                return this.innerText;
            },
            val: function(value) {
                if (value) {
                    this.setAttribute("value", value);
                    return this;
                }
                if (_.contains(["select", "input"], this.tagName.toLowerCase())) {
                    return this.value;
                }
                return this.getAttribute("value");
            },

            on: function(type, fn) {
                // addEvent(type, this, fn.bind(this), false);
                addEvent(type, this, fn, false);
                return this;
            },
            off: function(type, fn) {
                // if (fn) {
                // removeEvent(type, this, fn.bind(this), false)
                removeEvent(type, this, fn, false)
                // }
                return this;
            },
            trigger: function(name) {
                console.log("event trigger")
                var ev = document.createEvent("UIEvents"); //HTMLEvents
                ev.initEvent(name, true, true);
                dispatchEvent(ev, this);
                return this;
            },
            //与array一致性
            each: function(fn) {
                _.isFunction(fn) && fn.call(this, this, 0);
                // _.isFunction(fn) && fn.call(this, 0, this) // fn.bind(this)(0, this);
            },
            css: function(opt) {
                var len = arguments.length;
                if (len == 1) {
                    if (_.isObject(opt)) {
                        for (key in opt) {
                            // css()
                            this.style[key] = opt[key];
                        }
                    }
                } else if (len == 2) {
                    // prop, val
                    this.style[opt] = arguments[1];
                }
                return this;
            },
            width: function() {
                return this.offsetWidth;
            },
            height: function() {
                return this.offsetHeight;
            },
            outerWidth: function() {
                return _.max(this.scrollWidth, this.offsetWidth, this.clientWidth) + Number(this.style.marginLeft) + Number(this.style.marginRight);
            },

            dir: function(elem, dir, until) {
                var matched = [],
                    truncate = until !== undefined;

                while ((elem = elem[dir]) && elem.nodeType !== 9) {
                    if (elem.nodeType === 1) {
                        if (truncate && jQuery(elem).is(until)) {
                            break;
                        }
                        matched.push(elem);
                    }
                }
                return matched;
            },
            parent: function() {
                return this.parentNode;
            },
            closest: function(selector) {
                return _.closest.call(this, selector);
            },
            sibling: function(n, elem) {
                var matched = [];
                for (; n; n = n.nextSibling) {
                    if (n.nodeType === 1 && n !== elem) {
                        matched.push(n);
                    }
                }
                return matched;
            },
            siblings: function() {
                return this.sibling((this.parentNode || {}).firstChild, this);
            },
            children: function(elem) {
                return this.sibling(elem.firstChild);
            },
            last: function() {
                return this;
            },
            isHide: function() {
                return _.isHide(this);
            },
            filter: function(key) {
                switch (key) {
                    case "visible":
                        if (_.isShow(this)) {
                            return this;
                        }
                        return null;
                        break;
                    case "hidden":
                        if (_.isHide(this)) {
                            return this;
                        }
                        return null;
                        break;
                    default:
                        return this;

                }

            },
            append: function(elem) {
                if (_.isElement(elem)) {
                    return this.appendChild(elem);
                } else if (_.isString(elem)) {
                    this.innerHTML = this.innerHTML + elem;
                }


            },
            //tap事件
            onTap: function(handler) {
                // toucher.tap(this, handler);

                toucher({
                    el: this,
                    type: "tap",
                    listener: handler
                })

                // var self = this,
                //     startX, startY, startTime, lastMoveY, lastMoveTime;


                // this.off("touchstart").on("touchstart", function(ev) {
                //     ev = ev || event; //兼容firefox  jquery :ev.originalEvent
                //     console.log(ev);
                //     var touch = ev;
                //     // self.addClass("active");
                //     ev.target.addClass("active");

                //     // ev.stopPropagation();
                //     startX = ev.touches[0].pageX; //clientX
                //     startY = ev.touches[0].pageY;
                //     startTime = new Date().getTime();
                // });
                // // 惯性移动
                // this.off("touchend").on("touchend", function(ev) {
                //     var endX, endY, nowTime;
                //     endX = ev.changedTouches[0].pageX;
                //     endY = ev.changedTouches[0].pageY;
                //     nowTime = new Date().getTime();
                //     ev.target.removeClass("active");

                //     var y = endY - startY;
                //     var x = endX - startX;
                //     var duration = nowTime - startTime; //滑动时间
                //     if (Math.abs(x) <= 5 && Math.abs(y) <= 5 && duration < 200) {
                //         handler && handler(ev);
                //         // Events.trigger("tap", ev.target, ev)
                //     } else {
                //         console.log("x:" + x + " y:" + y + " duration:" + duration);
                //     }
                // });
            },
            //清除事件
            clear: function(rootId) {
                // if (rootId) {
                //     scroller.removeEvent(rootId)
                // } else {
                //     $(".container").children().each(function(index, item) {
                //         scroller.removeEvent($(item)) //.attr("id")
                //     });
                // }
            },
            clearEvent: function() {
                // elem.events=null;
                this.events = null;
                return this;
            },
            addEvent: function(fns, reset) {
                var self = this;
                if (_.isFunction(fns)) {
                    self.events = self.events || [];
                    self.events.push(fns)
                } else if (_.isArray(fns)) {
                    self.events = _.clone(fns) || [];
                } else {
                    self.events = [];
                }

                var tapHandler = function(ev) {
                    for (var i = 0; i < self.events.length; i++) {
                        self.events[i] && _.isFunction(self.events[i]) && self.events[i].call(self, ev.target, ev);
                    }
                }

                if (isSupportTouch) {
                    self.onTap(tapHandler);

                } else {
                    self.off("click").on("click", tapHandler);
                }
            }
        };
        ele_prototype.$ = ele_prototype.query;



        var arr_prototype = {
            //支持链式
            query: function(selector) {
                var list = [];
                _.each(this, function(item) {
                    if (_.isElement(item)) {
                        var ele = _.autoid(item).query(selector);
                        if (_.size(ele) >= 1) {
                            list.push(ele);
                        }
                    }
                });
                if (list.length == 1)
                    return list[0];
                return list;
            },
            // Array.prototype.each=Array.prototype.forEach.bind(this);
            each: function(fn) {
                if (_.isFunction(fn)) {
                    _.each(this, function(item, index) {
                        fn.call(item, item, index)
                    })
                }
            },
            last: function() {
                return this[this.length - 1];
            },
            filter: function(key) {
                var arr = [];
                _.each(this, function(item, index) {
                    var match = item.filter(key)
                    match && arr.push(match)
                });
                return arr;
            },
            append: function(elem) {
                var arr = [];
                _.each(this, function(item, index) {
                    var match = item.append(elem);
                    match && arr.push(match);
                });
                return arr;
            },
            random: function() {
                return this[Math.floor(Math.random() * this.length)];
                // return _.random.call(this,this);
            }

            // contains: function(a) {
            //     return this.indexOf(a) != -1;
            // },
            // uniq: function() {
            //     var ra = new Array();
            //     for (var i = 0; i < this.length; i++) {
            //         if (!ra.contains(this[i])) {
            //             ra.push(this[i]);
            //         }
            //     }
            //     return ra;
            // },
            // each: function(fn) {
            //     fn = fn || Function.K;
            //     var a = [];
            //     var args = Array.prototype.slice.call(arguments, 1);
            //     for (var i = 0; i < this.length; i++) {
            //         var res = fn.apply(this, [this[i], i].concat(args));
            //         if (res != null) a.push(res);
            //     }
            //     return a;
            // },

        };
        arr_prototype.$ = arr_prototype.query;



        ['attr', 'remove', 'removeAttr', 'removeClass', 'addClass', 'html', 'on', 'off', 'trigger', 'css', 'addEvent', 'hide', 'show', 'active', 'passive', 'clearEvent'].forEach(function(t) {
            arr_prototype[t] = function() {
                var args = slice.call(arguments),
                    len = args.length;
                if (len == 1 && _.isString(args[0])) { //getter
                    var results = [];
                    _.each(this, function(item) {
                        if (_.isElement(item)) {
                            results.push(item[t].apply(item, args));
                        }
                    });
                    return results;
                } else { //setter
                    _.each(this, function(item) {
                        if (_.isElement(item)) {
                            item[t].apply(item, args);
                        }
                    });
                    return this;
                }
            }
        });



        //原型扩展
        Object.prototype = _.extproto(Object.prototype, obj_prototype);
        Number.prototype = _.extproto(Number.prototype, num_prototype);
        String.prototype = _.extproto(String.prototype, str_prototype);
        Date.prototype = _.extproto(Date.prototype, dat_prototype);
        Element.prototype = _.extproto(Element.prototype, ele_prototype);
        Array.prototype = _.extproto(Array.prototype, arr_prototype);


        //  事件模块
        var addEvent = function(type, el, listener) {

            if (_.isFunction(listener)) {
                if (window.addEventListener) {
                    el.addEventListener(type, listener, false);
                } else {
                    el.attachEvent('on' + type, listener);
                }

                // storeEvent(type, el, listener);
                if (!el.events) {
                    el.events = []
                }
                el.events.push({
                    type: type,
                    el: el,
                    listener: listener
                }); //listener

            } else if (_.isArray(listener)) {

                listener.forEach(function(t) {
                    addEvent(type, el, t);
                })
            }
        };

        var removeEvent = function(type, el, listener) {
            if (!_.isElement(el)) return false;

            if (listener) {

                if (window.removeEventListener) {
                    el.removeEventListener(type, listener, false);
                } else {
                    el.detachEvent('on' + type, listener);
                }
                //delete event
                if (!el.events) {
                    el.events = [];
                }
                var i = el.events.length;
                while (i--) {
                    if (el.events[i].type == type && el.events[i].listener == listener) {
                        el.events.splice(i, 1);
                    }
                }

            } else {
                el.events && el.events.forEach(function(t) {
                    removeEvent(t.type, t.el, t.listener)
                })
            }

        };
        var startPos = {},
            endPos = {},
            offset = {},
            _touchstart = isSupportTouch ? "touchstart" : "mousedown",
            _touchend = isSupportTouch ? "touchend" : "mouseup",
            _touchmove = isSupportTouch ? "touchmove" : "mousemove";
        var containerWidth = document.documentElement.clientWidth >= 680 ? 680 : document.documentElement.clientWidth;

        //事件
        var Events = (function() {
            var storeEvents = [];

            return {
                store: function(o) {
                    if (o) storeEvents.push(o);
                    return storeEvents;
                },
                filter: function(obj) {
                    return _.filter(storeEvents, function(item) {
                        var flag = true;
                        for (x in obj) {
                            if (item[x] != obj[x]) {
                                flag = false;
                            }
                        }
                        return flag;
                    });
                },
                reset: function() {
                    storeEvents = [];
                },
                on: function(type, el, listener, once) {
                    var self = this;
                    if (!isSupportTouch && type == _tap) {
                        type = "click";
                    }
                    // var canDrag = true;


                    switch (type) {
                        case _tap:
                            var starHandler = function(ev) {
                                startPos = _.pos(ev);
                            }
                            var endHandler = function(ev) {
                                endPos = _.pos(ev);
                                var x = endPos.x - startPos.x,
                                    y = endPos.y - startPos.y,
                                    duration = endPos.time - startPos.time;

                                if (Math.abs(x) <= 5 && Math.abs(y) <= 5 && duration < 200) { //快击
                                    if (_.isFunction(listener)) {
                                        listener.call(el, endPos.el, ev);
                                    } else if (_.isArray(listener)) {
                                        listener.forEach(function(t) {
                                            t.call(el, endPos.el, ev);
                                        });
                                    }
                                    if (once) {
                                        self.off(type, el);
                                    }
                                }
                            }
                            addEvent(_touchstart, el, starHandler);
                            addEvent(_touchend, el, endHandler);
                            break;
                        case _drag:
                        case "drag-y":
                        case "drag-x":
                            var isDragging;
                            var preventDefault = function(ev) {
                                ev.preventDefault();
                            }
                            //容器
                            // var container=el.parent();
                            // var containerPos=_.pos(container);
                            // console.log(containerPos)
                            // container.with


                            var maxLeft = document.documentElement.clientWidth - el.clientWidth;
                            var maxTop = document.documentElement.clientHeight - el.clientHeight;



                            var starHandler = function(ev) {
                                startPos = _.pos(ev);
                                offset = _.pos(el);
                                el.css({ position: "absolute",cursor:"move" });
                                isDragging = true;
                                //不准整屏移动
                                addEvent(_touchmove, document, preventDefault);
                            }
                            var moveHandler = function(ev) {
                                endPos = _.pos(ev);
                                isDragging &&
                                    (function() {
                                        var left = endPos.x - startPos.x + offset.x;
                                        var top = endPos.y - startPos.y + offset.y;
                                        left = _.min(left, maxLeft);
                                        left = _.max(0, left);
                                        top = _.min(top, maxTop);
                                        top = _.max(0, top);
                                        if (type != "drag-y") el.css({ left: left + "px" });
                                        if (type != "drag-x") el.css({ top: top + "px" });
                                    })()
                            }
                            var endHandler = function(ev) {
                                endPos = _.pos(ev);

                                isDragging = false;
                                //允许整屏移动
                                removeEvent(_touchmove, document, preventDefault);
                                if (_.isFunction(listener)) {
                                    listener.call(el, endPos.el, ev);
                                }
                            }


                            addEvent("mouseover", el, function(ev) {
                                el.css({ cursor: "move" })
                            });
                            addEvent("mouseout", el, function(ev) {
                                el.css({ cursor: "normal" })
                            });
                            addEvent(_touchstart, el, starHandler);
                            addEvent(_touchmove, document, moveHandler);
                            addEvent(_touchend, document, endHandler);
                            break;
                        default:
                            var _handler = function(ev) {
                                if (_.isFunction(listener)) {
                                    listener.call(el, el, ev);

                                } else if (_.isArray(listener)) {
                                    listener.forEach(function(t) {
                                        t.call(el, el, ev);
                                    });
                                }
                                if (once) {
                                    self.off(type, el);
                                }
                            }
                            addEvent(type, el, _handler);
                            break;
                    }
                },
                off: function(type, el, listener) {
                    if (_tap == type) {
                        removeEvent(_touchstart, el);
                        removeEvent(_touchend, el);
                    } else {
                        removeEvent(type, el, listener);
                    }
                }
            }
        })();

        var toucher = window.toucher = function(options) {
            return new toucher.prototype.init(options);
        }
        toucher.prototype = {
            constructor: toucher,
            init: function(options) {
                var self = this;
                if (!options) {
                    if (options == false) {
                        self._offEvent();
                    }
                    return;
                }
                var es = [];
                var _option = function(opt) {
                    var el = _.query(opt.el),
                        type = opt.type || "click",
                        clear = _.isUndefined(opt.clear) ? true : opt.clear, //clear 打扫:加载新事件事情，清除掉之前的事件,
                        listener = opt.listener || opt.callback,
                        once = opt.once || false; //事件只运行一次，运行一次就自行remove
                    if (_.isElement(el)) {
                        if (clear) {
                            self.clear({
                                el: el,
                                type: type
                            });
                        }
                        es.push({
                            type: type,
                            el: el,
                            listener: listener,
                            once: once
                        })
                    } else if (_.isArray(el)) {
                        el.forEach(function(t) {
                            if (clear) {
                                self.clear({
                                    el: t,
                                    type: type
                                });
                            }
                            es.push({
                                type: type,
                                el: t,
                                listener: listener,
                                once: once
                            })

                        });
                    }
                }
                if (_.isArray(options)) {
                    options.forEach(function(t) {
                        _option(t);
                    })
                } else {
                    _option(options);
                }

                self._onEvent(es);
            },
            _onEvent: function(es) {
                es.forEach(function(t) {
                    Events.store(t);
                    Events.on(t.type, t.el, t.listener, t.once);
                });
                return this;
            },
            _offEvent: function(filter) {
                Events.filter(filter).forEach(function(t) {
                    Events.off(t.type, t.el);
                });
                return this;
            },
            clear: function(filter) {
                return this._offEvent(filter);
            }

        };
        toucher.prototype.init.prototype = toucher.prototype;
        // ['tap', 'longTap', 'doubleTap', 'pinch', 'spread', 'rotate', 'swipe', 'swipeUp', 'swipeDown', 'swpieLeft', 'swipeRight'].forEach(function(item) {
        //     toucher.prototype[item] = function(selector, fn) {
        //         var el = _.query(selector);
        //         if (_.isArray(el)) {
        //             el.forEach(function(t) {
        //                 toucher.prototype.on.call(this, item, t, fn.bind(t))
        //             });
        //         } else if (_.isElement(el)) {
        //             toucher.prototype.on.call(this, item, el, fn.bind(el))
        //         }
        //         // var args = slice.call(arguments);
        //         // args.unshift(item);
        //         // toucher.prototype.on.apply(this, args)
        //     }
        // });


        //字符串遍历 解析 区别于正则获取解析 
        //用在解析 markdown  json xml等格式的字符串上
        //var w=walker({text:"bbb| fidld1|field2|field3|aaa \n |new| line|fff|"});
        //console.log(w.table)
        // var w = walker({ text: match });
        // var tbl = w.table
        // // console.log()
        // // var line = tbl[0];
        // // var str = ""
        // // for (var j = 0, cols = line.length; j < cols; j++) {
        // //     str += _wrap("td", line[j])
        // // }
        // // str = _wrap("tr", str);

        // // var tbody = ""
        // var line, str = "";
        // for (var x = 0, len = tbl.length; x < len; x++) {
        //     var str2 = "",
        //         line = tbl[x];
        //     for (var y = 0, cols = line.length; y < cols; y++) {
        //         str2 += _wrap("td", line[y])
        //     }
        //     str += _wrap("tr", str2);
        // }

        // str = _wrap("table", str);
        // return str;
        var walker = window.walker = function(options) {
            return new walker.prototype.init(options);
        }
        walker.prototype = {
            constructor: walker,
            ch: "",
            pos: 0,
            line: 0,
            col: 0,
            max: 0,
            text: "",
            escapee: {
                "\"": "\"",
                "\\": "\\",
                "/": "/",
                b: "\b",
                f: "\f",
                n: "\n",
                r: "\r",
                t: "\t"
            },
            init: function(options) {
                if (_.isString(options)) {
                    this.text = options
                } else if (_.isObject(options)) {
                    this.text = options.text || "";
                    this.debug = options.debug || false;
                } else {
                    throw {
                        name: "input error",
                        messasge: "string or {text:\"\"} is required"
                    }
                }
                this.max = this.text.length;
                this.line = 0;
                this.col = 0;
                this.pos = 0;
                this.ch = this.peek();

                return this;
            },
            parseTable: function() {
                this.table = [];
                var find, line = [];
                while (this.next()) {
                    find = this.until("|");
                    find && line.push(find)
                    if (this.ch === "\n" || this.pos >= this.max) {
                        this.table.push(line); //.slice(0)
                        line = [];
                    }
                }
                return this.table;
            },
            peek: function(step) {
                var token = this.text.charAt(this.pos);
                if (step) {
                    token = "";
                    for (var i = 0; i <= step; i++) {
                        token += this.text.charAt((this.pos + i) >= this.max ? this.max : (this.pos + i));
                    }
                }
                return token;
            },
            eof: function() {
                return this.peek() == '';
            },
            next: function(current) {
                if (current && current !== this.ch) {
                    error("Expected '" + current + "' instead of '" + this.ch + "'");
                }
                this.ch = this.text.charAt(this.pos++);
                if (this.ch == '\n') {
                    this.line++;
                    this.col = 0;
                } else {
                    this.col++;
                }
                if (this.debug) this.token = this.peek(10);
                return this.ch;
            },
            back: function() {
                this.ch = this.text.charAt(this.pos--);
                return this.ch;
            },
            error: function(m) {
                var token = "",
                    len = 10;
                while (len--) {
                    this.next()
                    token += this.ch
                }

                var info = {
                    name: "SyntaxError",
                    message: m,
                    pos: this.pos,
                    ch: this.ch,
                    line: this.line,
                    col: this.col,
                    text: this.text,
                    token: token,
                };
                // throw info;
                console.log(info);
            },
            info: function() {
                return {
                    pos: this.pos,
                    ch: this.ch,
                    line: this.line,
                    col: this.col,
                    text: this.text,
                }
            },
            until: function(separator) {
                var value = "",
                    ch = this.ch;
                if (ch === separator) { //开头
                    while (ch = this.next()) {
                        if (ch === separator) { //结尾
                            this.back(); //回退
                            return value;
                        }

                        if (ch === "\n") {
                            value = "";
                            break;
                        }
                        value += ch;
                    }
                }
                return value;
            },
            json: function() {
                return this._parseJson()
            },
            _parseJson: function() {
                this._skipWhite();
                switch (this.ch) {
                    case "{":
                        return this._parseObj();
                        break;
                    case "[":
                        return this._parseArr();
                        break;
                    case ":":
                        return this._parseJson();
                        break;
                    case "\"":
                    case "\'":
                        return this._parseStr();
                        break;
                    default:
                        if (/[\d\.-]/.test(this.ch)) {
                            return this._parseNum();
                        } else {
                            return this._parseValue();

                        }

                        break;
                }
            },
            _parseObj: function() {
                this._skipWhite();
                var obj = {},
                    key;
                if ("{" == this.ch) {
                    while (this.next()) {
                        this._skipWhite();
                        if (this.ch == "}") {
                            this.next();
                            return obj;
                        }
                        if (this.ch) {
                            key = this._parseKey();
                            if (Object.hasOwnProperty.call(obj, key)) {
                                this.error("Duplicate key '" + key + "'");
                                console.log(obj)
                            }
                            obj[key] = this._parseJson();
                        }
                    }
                }
                return obj;
            },
            _parseArr: function() {
                this._skipWhite()
                var arr = [];
                if ("[" == this.ch) {
                    while (this.next()) {
                        this._skipWhite();
                        if (this.ch == "]") {
                            this.next();
                            return arr;
                        }
                        if (this.ch) {
                            var value = this._parseJson()
                            if (value) {
                                arr.push(value);
                                if (this.ch === "]") {
                                    this.next();
                                    return arr;
                                }
                            }
                        }
                    }
                }
                return arr;
            },
            _skipWhite: function() {
                while (this.ch && this.ch <= " ") {
                    this.next();
                }
            },
            _removeQuote: function(value) {
                return value.replace(/(?:^"(.*)"$)|(?:^'(.*)'$)/, "$1$2");
            },
            _parseKey: function() {
                var value = this.ch;
                while (this.next()) {
                    if (this.ch == ":") {
                        this.next();
                        return this._removeQuote(value);
                    }
                    value += this.ch;
                }
                // this.error("Bad string");
            },
            _parseStr: function() {
                this._skipWhite();
                var value = "",
                    starFlag = this.ch;
                if ("\"\'".indexOf(starFlag) >= 0) {
                    while (this.next()) {
                        if (starFlag == this.ch) {
                            this.next();
                            return value;
                        }
                        if (this.ch === "\\") {
                            this.next();
                            if (this.escapee[this.ch]) {
                                value += this.escapee[this.ch];
                            }
                        }
                        value += this.ch;
                    }
                }

            },
            _parseNum: function() {
                if (/[\d\.-]/.test(this.ch)) {
                    var value = this.ch;
                    while (this.next()) {
                        if (",}]".indexOf(this.ch) >= 0) {
                            return value = +value;
                        }
                        value += this.ch;
                    }
                }
            },
            _parseValue: function() {
                var value = this.ch;
                while (this.next()) {
                    if (",}]".indexOf(this.ch) >= 0) {
                        // this.next();
                        return this._removeQuote(value);
                    }
                    value += this.ch;
                }
            }
        }
        walker.prototype.init.prototype = walker.prototype;


        //page log
        var logger = window.logger = function(options) {
            return new logger.prototype.init(options);
        }
        logger.prototype = {
            constructor: logger,
            init: function(options) {
                var self = this;
                var div = document.createElement("div");
                div.className = "_console";
                var div_handle = document.createElement("div");
                div_handle.className = "_console_handle";
                var div2 = document.createElement("div");
                div2.className = "_console_log";
                div.appendChild(div_handle);
                div.appendChild(div2);
                _.$("body").appendChild(div);

                console.log = function() {
                    var arg = Array.prototype.slice.call(arguments);
                    template({
                        el: "._console_log",
                        act: "append",
                        template: '<div class="_item">{=result}</div>',
                        data: {
                            result: arg.length == 1 ? arg[0] : arg
                        }
                    })
                }

                toucher([{
                    el:"._console",
                    type:"drag"
                },{
                    el:"._console_handle",
                    type:"tap",
                    callback:function(item,ev){
                        var log=_.$("._console_log");

                        _.isShow(log)?_.hide(log):_.show(log);

                    }
                }])
            }
        }

        logger.prototype.init.prototype = logger.prototype;



        //路由
        // router({
        //     config:[{name:'',url:'#',template:'#tpl_id'}],
        //     pageAppend:function(){

        //     },
        //     defaultPage:"home"
        // })
        //router({"markdown":"markdown"})
        var router = window.router = function(options) {
            return new router.prototype.init(options);
        }

        router.prototype = {
            constructor: router,
            // $container: $('#container'),
            _pageStack: [],
            _configs: [],
            _pageAppend: function() {},
            _defaultPage: null,
            _pageIndex: 1,

            routes: {},
            defaultAction: "home",

            init: function(options) {
                var self = this;


                if (options) {

                    this.routes = options;

                    // if (_.isArray(options.config)) {
                    //     this._configs = options.config;
                    // } else if (_.isObject(options.config)) {
                    //     for (var page in options.config) {
                    //         this.push(options.config[page]);
                    //     }
                    // }

                    // this._pageAppend = options.pageAppend || function() {};
                    // this._defaultPage = this._find('name', options.defaultPage);
                }
                // this.container = _.$("#container");

                addEvent("hashchange", window, function() {
                    var u = self.parseUrl();
                    self._go(u.route);

                })




                // addEvent("hashchange", window, function() {
                //     var state = history.state || {};
                //     var url = location.hash.indexOf('#') === 0 ? location.hash : '#';
                //     var page = self._find('url', url) || self._defaultPage;
                //     if (state._pageIndex <= self._pageIndex || self._findInStack(url)) {
                //         self._back(page);
                //     } else {
                //         self._go(page);
                //     }
                // })


                //hash改变触发
                // toucher({
                //     el: window,
                //     type: "hashchange",
                //     callback: function() {
                //         var u = self.parseUrl();

                //         self._go(u.route);
                //         // var state = history.state || {};
                //         // var url = location.hash.indexOf('#') === 0 ? location.hash : '#';


                //         // var page = self._find('url', url) || self._defaultPage;
                //         // if (state._pageIndex <= self._pageIndex || self._findInStack(url)) {
                //         //     self._back(page);
                //         // } else {
                //         //     self._go(page);
                //         // }
                //     }
                // });



                //浏览器后退触发
                // toucher({
                //     el: window,
                //     type: "popstate",
                //     callback: function() {
                //         var state = history.state || {};
                //         var url = location.hash.indexOf('#') === 0 ? location.hash : '#';
                //         var page = self._find('url', url) || self._defaultPage;
                //         if (state._pageIndex <= self._pageIndex || self._findInStack(url)) {
                //             self._back(page);
                //         } else {
                //             self._go(page);
                //         }
                //     }
                // });


                // $(window).on('hashchange', function() {
                //     var state = history.state || {};
                //     var url = location.hash.indexOf('#') === 0 ? location.hash : '#';
                //     var page = self._find('url', url) || self._defaultPage;
                //     if (state._pageIndex <= self._pageIndex || self._findInStack(url)) {
                //         self._back(page);
                //     } else {
                //         self._go(page);
                //     }
                // });

                // window.addEventListener('popstate', function(e) {
                //     if (history.state) {
                //         var state = e.state;
                //         console.log(state.url);
                //         //do something(state.url, state.title);
                //     }
                // }, false);

                if (history.state && history.state._pageIndex) {
                    this._pageIndex = history.state._pageIndex;
                }

                this._pageIndex--;

                var url = location.hash.indexOf('#') === 0 ? location.hash : '#';
                var page = self._find('url', url) || self._defaultPage;
                this._go(page);
                return this;

            },
            getAction: function(route) {
                return this.routes[route] ? this.routes[route] : this.defaultAction;


            },
            ////////
            getSearch: function() {
                var match = location.href.replace(/#.*/, '').match(/\?.+/);
                return match ? match[0] : '';
            },

            // Gets the true hash value. Cannot use location.hash directly due to bug
            // in Firefox where location.hash will always be decoded.
            getHash: function() {
                var match = location.href.match(/#(.*)$/);
                return match ? match[1] : '';
            },
            decodeFragment: function(fragment) {
                return decodeURI(fragment.replace(/%25/g, '%2525'));
            },
            getPath: function() {
                var path = this.decodeFragment(
                    location.pathname + this.getSearch()
                ).slice(0); //this.root.length - 1
                return path.charAt(0) === '/' ? path.slice(1) : path;
            },
            parseUrl: function() {
                var params = {},
                    href = location.href,
                    hash = location.hash,
                    route = hash;

                var getHash = function() {
                    var match = location.href.match(/#(.*)$/);
                    return match ? match[1] : '';
                };
                var path = this.getPath();

                hash = getHash();
                // api.html?id=3&page=fff#events
                // api.html#events?id=3&page=fff
                // api.html#events/1122
                href.replace(/[?&](.+?)=([^&#]*)/g, function(_, k, v) {
                    params[k] = decodeURI(v)
                });
                //#去重
                if (hash) {
                    hash = hash.length > 1 ? hash.replace(/#+/g, "#") : "";
                    route = hash.replace(/#/g, "");
                }
                return {
                    params: params,
                    hash: hash,
                    route: route,
                    path: path
                }
            },

            ////
            push: function(config) {
                this._configs.push(config);
                return this;
            },
            go: function(to) {

                if (to) {
                    location.hash = to;
                }
                // var config = this._find('name', to);
                // if (!config) {
                //     return;
                // }
                // location.hash = config.url;
            },
            _go: function(route) {
                this._pageIndex++;
                history.replaceState && history.replaceState({ _pageIndex: this._pageIndex }, '', location.href);
                var a = this.getAction(route);

                if (_.isFunction(a)) {
                    a.call(this);
                } else {
                    console.log(a)
                }

                console.log(this._pageIndex);

            },
            // _go: function(config) {
            //     if (config) {
            //         this._pageIndex++;

            //         history.replaceState && history.replaceState({ _pageIndex: this._pageIndex }, '', location.href);

            //         // var html = _.$(config.template).html();
            //         // var $html = _.$(config.template).addClass('slideIn').addClass(config.name);
            //         // $(html).addClass('slideIn').addClass(config.name);
            //         // $html.on('animationend webkitAnimationEnd', function() {
            //         //     $html.removeClass('slideIn').addClass('js_show');
            //         // });

            //         // if (config.template) {
            //         //     var $html = _.$(config.template);
            //         //     if ($html) {
            //         //         $html.addClass('slideIn').addClass(config.name);
            //         //         this.container.append($html);
            //         //         this._pageAppend && this._pageAppend.call(this, $html);
            //         //         this._pageStack.push({
            //         //             config: config,
            //         //             dom: $html
            //         //         });
            //         //     }
            //         // }


            //         if (!config.isBind) {
            //             this._bind(config);
            //         }
            //     }
            //     return this;
            // },
            back: function() {
                history.back();
            },
            _back: function(config) {
                this._pageIndex--;

                var stack = this._pageStack.pop();
                if (!stack) {
                    return;
                }

                var url = location.hash.indexOf('#') === 0 ? location.hash : '#';
                var found = this._findInStack(url);
                if (!found) {
                    // var html = $(config.template).html();
                    // var $html = $(html).addClass('js_show').addClass(config.name);


                    var $html = _.$(config.template).addClass('js_show').addClass(config.name);
                    $html.insertBefore(stack.dom);


                    if (!config.isBind) {
                        this._bind(config);
                    }

                    this._pageStack.push({
                        config: config,
                        dom: $html
                    });
                }

                // stack.dom.addClass('slideOut').on('animationend webkitAnimationEnd', function() {
                //     stack.dom.remove();
                // });

                return this;
            },
            _findInStack: function(url) {
                var found = null;
                for (var i = 0, len = this._pageStack.length; i < len; i++) {
                    var stack = this._pageStack[i];
                    if (stack.config.url === url) {
                        found = stack;
                        break;
                    }
                }
                return found;
            },
            _find: function(key, value) {
                var page = null;
                for (var i = 0, len = this._configs.length; i < len; i++) {
                    if (this._configs[i][key] === value) {
                        page = this._configs[i];
                        break;
                    }
                }
                if (!page) {
                    var page = { "template": value, id: value, url: value };
                    page[key] = value;
                    this.push(page)
                }
                return page;
            },
            _bind: function(page) {
                var events = page.events || {};
                for (var t in events) {
                    for (var type in events[t]) {
                        // this.$container.on(type, t, events[t][type]);
                    }
                }
                page.isBind = true;
            }
        };
        router.prototype.init.prototype = router.prototype;



        //标准过滤器
        var StandardFilters = {
            string: function(val) {
                if (_.isArray(val) || _.isObject(val)) {
                    // val = JSON.stringify(val);
                    val = _.stringify(val);
                }
                return val;
            },
            //数组第一个
            first: function(val) {
                if (_.isArray(val)) {
                    val = val[0];
                }
                return val;
            },
            last: function(val) {
                if (_.isArray(val)) {
                    val = val[val.length - 1];
                }
                return val;
            },
            pre: function(val) {
                return _.preHtml(val);
            },
            //取整 四舍五入
            int: function(val) {
                if (_.isNumber(Number(val))) {
                    return Math.round(Number(val));
                } else {
                    return val;
                }
            },
            number: function(val) {
                return Number(val);
            },
            wan: function(val) {
                return Number(val) > 10000 ? (Number(val) / 10000).toFixed(1) + "万" : val;
            },
            fixed: function(val) {
                return Number(val).toFixed(1);

            },
            cent: function(val) {
                return (Number(val) / 100).toFixed(2);

            },
            percent: function(val) {
                return Math.ceil(val * 100) + "%";

            },
            yearmonth: function(val) {
                return (new Date(Number(val))).format("YYYY年MM月"); //moment(Number(val))

            },
            monthdaytime: function(val) {
                return (new Date(Number(val))).format("MM月DD日 HH:mm");
            },
            datetime: function(val) {
                return (new Date(Number(val))).format("YYYY-MM-DD HH:mm");
            },
            date: function(val) {
                return (new Date(Number(val))).format("YYYY-MM-DD");
            },
            time: function(val) {
                return (new Date(Number(val))).format("HH:mm");
            },
            //默认头像
            avatar: function(val) {
                return val ? ' style="background-image: url(' + val + ');"' : ''
            },

            file: function(val) {
                ////文件加载  ajax加载 "/comein-files/" + val.substr(val.indexOf('Detail'), val.length)
                return "<div data-file='" + val + "'></div>";
            },
            text: function(val) {
                return _.escape(val)
            },
        };
        ["markdown", "escape", "unescape"].forEach(function(t) {
            StandardFilters[t] = function(val) {
                return _[t](val);
            }
        });
        ['round', 'ceil', 'floor'].forEach(function(t) {
            StandardFilters[t] = function(val) {
                if (_.isNumber(Number(val))) {
                    return Math[t](Number(val));
                } else {
                    return val;
                }
            }
        });
        //调用过滤器 
        var callFilter = function(val, filter, data) {
            if (filter) {
                var self = this,
                    _callFilter = function(val, filterName, data) {
                        var _filter = customFilters[filterName];
                        if (_.isUndefined(_filter)) {
                            return val
                        } else if (_.isFunction(_filter)) {
                            val = _filter.call(self, val, data);
                        } else {
                            try {
                                var fn = new Function("return (" + _filter + ".call(this,arguments[0]));");
                                val = fn.call(self, val, data);
                            } catch (e) {
                                try {
                                    var fn = new Function("data", "return (" + _filter + ");");
                                    val = fn.call(self, val, data);
                                } catch (e) {
                                    val = _filter;
                                }
                            }
                        }
                        return val;
                    };


                var fs = filter.split(","),
                    len = fs.length;
                if (len > 0 && fs[len - 1] != "string") {
                    fs.push("string");
                    len++;
                }
                // if (_.isArray(val) || _.isObject(val)) {
                //     val = _.stringify(val);
                // }

                if (len == 1) {
                    val = _callFilter.call(self, val, filter, data);
                } else if (len > 1) {
                    fs.forEach(function(t) {
                        val = _callFilter.call(self, val, t, data);
                    });
                }
            }
            return val;
        };

        //preModel 预处理
        // <div model="name">this is a  model </div>
        //<div model="name">{=name} </div>
        var regModel = /<[^>]+?model=\"(.*?)\".*?(>.*?<)\/[^>]+?>/gi
        var regbind = /<[^>]+?bind=\"(.*?)\".*?(>.*?<)\/[^>]+?>/gi
        var preModel = function(tpl) {
            var matcher = new RegExp([
                regModel.source,
                regbind.source,
            ].join('|') + '|$', 'gi');

            return tpl.replace(matcher, function(match, name, text, name2, text2) {
                name = name || name2;
                text = text || text2;
                return match.replace(text, ">{=" + name + "}<");
            })
        };

        //解析模板标签
        //{=name|filter}  /{=(.*?)(?:\|(.*?))?}/g
        var parseTag = _.parseTag = function(tpl, data) {
            var self = this;
            return tpl.replace(reg_tpl_tag, function(match, name, filter) {
                name = name.trim();
                filter = (filter || "string").trim();
                var val = "";

                try {
                    if (filter.indexOf("$") == 0) { //filter map
                        filter = eval("data." + filter.replace("$", ""));
                    }
                    if ("$index" == name.toLowerCase()) {
                        return $index++;
                    } else if ("$length" == name.toLowerCase()) {
                        return $length;
                    } else if (reg_operation_symbol.test(name)) {
                        val = data.cmd(name)
                    } else {
                        val = _.getVal(data, name);
                    }
                } catch (e) {
                    console.log(e, data);
                }
                if (_.isUndefined(val)) {
                    val = "";
                }
                // return val = callFilter.call(data, val, filter);
                // if(_.isObject(val)||)
                return val = callFilter.call(self, val, filter, data);
            })
        };
        //解析模板
        //tpl, data, syntax, groupTpl, lazyTpl, moreTpl, defaultTpl, loop
        var parseTpl = _.parseTpl = function(cfg) {
            var self = cfg || this,
                tpl = self.tpl || getTpl(self.template),
                groupTpl = self.groupTpl,
                lazyTpl = self.lazyTpl,
                moreTpl = self.moreTpl,
                defaultTpl = self.defaultTpl,
                loop = self.loop,
                syntax = self.syntax,
                data = self.data;

            if (_.isEmpty(tpl) && _.isEmpty(groupTpl)) {
                return "";
            }

            tpl && (function() {
                tpl = preModel(tpl);
            })();

            $index = 1;
            var str = "";
            if (_.isUndefined(data)) {
                $length = 0;
                str = _.isUndefined(defaultTpl) ? tpl : defaultTpl;
                // str = defaultTpl || tpl;
            } else if (_.isArray(data)) {
                var $length = data.length;

                var loopNumber = Number(loop) || $length; //循环次数 NaN
                if ((moreTpl || lazyTpl) && loopNumber >= $length) {
                    loopNumber = 3
                }

                var ps = [],
                    lastGroup = "",
                    currGroup = "";

                for (var i = 0; i < $length; i++) {
                    var item = data[i];

                    !_.isUndefined(groupTpl) && (function() { //分组模板
                        currGroup = parseTag.call(self, groupTpl, item);
                        if (currGroup != lastGroup) {
                            ps.push(currGroup);
                        }
                        lastGroup = currGroup;
                    })();

                    if (i >= loopNumber) {
                        if (!_.isUndefined(moreTpl)) { //更多模板
                            ps.push(parseTag.call(self, moreTpl, item));
                            break;
                        }

                        if (!_.isUndefined(lazyTpl)) { //懒加载
                            ps.push(parseTag.call(self, lazyTpl, item));
                        } else {
                            break;
                        }
                    } else {
                        if (tpl) { //模板
                            ps.push(parseTag.call(self, tpl, item));
                        }
                    }
                }
                str = ps.join("");
            } else if (_.isObject(data)) {
                $length = 1;
                tpl && (function() {
                    str = parseTag.call(self, tpl, data)
                })();
            } else {
                $length = 1;
                str = tpl;
            }
            var syntax = syntax || customSyntax;
            switch (syntax) {
                case "markdown":
                    str = _.markdown(str);
                    break;
                case "pre":
                    str = _.preHtml(str);
                    break;
                default:
                    break
            }
            return str;
        };

        //根据名称取得tpl
        var getTpl = _.getTpl = function(tplId) {
            if (tplId) {
                var _tpl = _.query(tplId.pound());
                return _tpl && _tpl.length > 0 ? _.text(_tpl).trim() : null;
            }
            return null;
        }
        //elment的tpl
        var elTpl = function(name) {
            var tpl, id;
            if (_.hasAttr(this, name)) {
                id = this.attr(name);
                if (id == "this" || _.isEmpty(id)) {
                    //用于不需要数据数据 ，但有指令的区块
                    //这个区块dom内的html不需要重置,意味着之前通过dom操作获取的节点，在模板解析后还可以用。
                    // tpl = _.text(this).trim();
                    tpl = _.html(this).trim();
                } else {
                    tpl = getTpl(id)
                }
            }
            return tpl;
            // return {
            //     id: id,
            //     name: name,
            //     tpl: tpl,
            // }
        };

        //act : append html before 模板替换动作  默认是 html，模板内都替换
        //解析节点
        var parseEl = function() {
            var self = this,
                tpl, syntax, groupTpl, lazyTpl, moreTpl, defaultTpl, loop,
                el = self.el,
                data = self.data,
                act = self.act,
                keyword = self.keyword;
            // tpl=self.tpl;
            self.tpl = self.template || elTpl.call(el, _template);
            [_group, _lazy, _more, _default].forEach(function(t) {
                if (self.templates && !_.isUndefined(self.templates[t])) {
                    self[t + "Tpl"] = self.templates[t];
                } else {
                    self[t + "Tpl"] = elTpl.call(el, t);
                }
            });
            if (self.tpl) {
                loop = "auto";
            } else if (self.groupTpl) {

            } else {
                tpl = el.html();
                loop = "1"; //非模板不循环
                if (!reg_tpl_tag.test(tpl)) {
                    parseDirective.call(self, el, data);
                    return false;
                }
            }
            // if (_.hasAttr(el, _template)) { //有模板情况
            //     loop = "auto"; //模板标记无限循环次数  
            // } else if (_.hasAttr(el, _group)) {

            // } else {
            //     tpl = el.html();
            //     loop = "1"; //非模板不循环
            //     if (!reg_tpl_tag.test(tpl)) {
            //         parseDirective.call(self, el, data);
            //         return false;
            //     }
            // }


            if (_.hasAttr(el, _syntax)) {
                syntax = el.attr(_syntax);
            }
            if (_.hasAttr(el, _noloop)) { //数组不循环
                loop = "1";
            }
            if (_.hasAttr(el, _loop)) {
                loop = el.attr(_loop);
            }
            if (_.hasAttr(el, _pagesize)) { //分页
                loop = el.attr(_pagesize);
            }
            if (_.hasAttr(el, _data)) { //指定数据子对象
                var child = el.attr(_data);
                if (_.contains(_.keys(data), child.split(".")[0])) {
                    data = eval("data." + child);
                }
            }

            if (_.isArray(data)) { //数组
                if (keyword && _.hasAttr(el, _keyword)) { //关键字查询
                    var name = el.attr(_keyword);
                    data = _.filter(data, function(item) {
                        var ks = name.split(",")
                        if (ks.length == 1) {
                            return _.indexOf(_.getVal(item, name), keyword) >= 0;
                        } else {
                            var flag = false;
                            ks.forEach(function(name) {
                                if (_.indexOf(_.getVal(item, name), keyword) >= 0) {
                                    flag = true;
                                }
                            });
                            return flag;
                        }

                    });
                }
            }

            //计算长度
            if (_.isArray(data)) {
                $length = data.length
            } else if (_.isUndefined(data)) {
                $length = 0;
            } else if (_.isObject(data)) {
                $length = 1;
            } else {
                $length = 1;
            }

            var tplConfig = _.extend({}, self, {
                data: data,
                loop: loop,
                syntax: syntax,
            });
            var str = parseTpl.call(tplConfig);
            switch (act) {
                case "append":
                    //兼容性处理
                    // el = el.parentNode.lastElementChild || el.parentNode.lastChild;
                    str = el.html() + str;
                    break;
                case "before":
                    str += el.html();
                default:
                    break;
            }
            //如果tpl不是外部命名，区块dom内的html不需要重置,意味着之前通过dom操作获取的节点，在模板解析后还可以用。
            if (self.tpl || el.attr(_template) || el.attr(_group)) {
                el.html(str);
            }

            parseDirective.call(self, el, data);
        };


        //标准指令
        var StandardDirectives = {};

        //指令解析
        var parseDirective = function(elem, data) {
            var self = this,
                elem_model = elem.query(_model.brackets());

            var onHandler = function(item, ev) {
                if (_.isElement(this)) {
                    var name = this.attr(_on),
                        // method = self.customMethods[name];
                        method = self.methods[name]; //每个独立methods
                    if (method && _.isFunction(method)) {
                        method.call(self, this, ev);
                    }
                }
            };

            var dragHandler = function() {
                console.log("dragHandler");

            }

            // var customHandler=function(item,ev){

            // }

            StandardDirectives[_on] = onHandler;


            var type;
            _.each(StandardDirectives, function(fn, key) {

                if (key == _drag) {
                    type = _drag;
                } else {
                    type = _tap;
                }

                if (_on != key) {

                    var customHandler = function(item, ev) {
                        var method = self.methods["_on_" + key];
                        if (method && _.isFunction(method)) {
                            method.call(self, item, ev);
                        }
                    }
                    toucher({
                        el: key.brackets(elem),
                        type: type,
                        clear: true,
                        listener: customHandler
                    });

                } else {
                    toucher({
                        el: key.brackets(elem),
                        type: type,
                        clear: true,
                        listener: fn
                    });

                }




            });

            //双向数据绑定
            elem_model && elem_model.length > 0 && elem_model.each(function(item, index) {
                var name = this.attr(_model),
                    v = _.query(this).val();
                template.prototype[name] = v

                var _result = _.clone(template.prototype);

                Object.defineProperty(template.prototype, name, {
                    set: function(newVal) { //监控数据被修改
                        var oldVal = _result[name];
                        _result[name] = newVal;

                        if (newVal != oldVal) {
                            template.prototype.apply(name, newVal);
                        }
                    },
                    get: function() {
                        return _result[name];

                    },
                    enumerable: true,
                    configurable: true
                });
            });

            //model change 数据绑定
            elem_model && elem_model.length > 0 && elem_model.on("keyup", function() {
                var v = _.query(this).val(),
                    name = this.attr(_model);
                elem.query(_model.brackets()).html(v);
                console.log(v, name);

                template.prototype[name] = v;
            });
        };

        //模板构造函数 
        function template(options) {
            return new template.prototype.init(options);
        }
        template.prototype = {
            constructor: template,
            init: function(options) {
                var self = this,
                    args = slice.call(arguments),
                    len = args.length;

                switch (len) {
                    case 0:
                        if (_.isEmpty(self.el)) {
                            return;
                        }
                        break;
                    case 1:
                        if (_.isArray(options)) {
                            // _.each(options, function(item) {
                            //     template(item);
                            // });
                            options.forEach(function(t) {
                                template(t)
                            })
                            return;
                        } else if (_.isObject(options)) {
                            _.each(options, function(v, k) {

                                switch (k) {
                                    case "el":
                                        self.el = options.el;

                                        if (_.isString(self.el)) {
                                            self.selector = self.el;
                                            self.el = _.query(self.el);
                                        }
                                        //转化jquery =>Element
                                        if (_.isJQuery(self.el)) {
                                            if (self.el.length == 1) {
                                                self.el = _.autoid(self.el.get(0));
                                            } else {
                                                var eles = [];
                                                self.el.each(function(item, idex) {
                                                    // eles.push(_.autoid(self));
                                                    eles.push(_.autoid(item));
                                                });
                                                self.el = eles;
                                            }
                                        }
                                        if (_.isElement(self.el) || _.isArray(self.el) && _.size(self.el) > 0) {
                                            rootEl = self.el;
                                        } else {
                                            console.log("not query el" + options.el)
                                            self.el = document.createElement("div");
                                            self.el.id = options.el.replace("#", "");
                                            if (options.template) {
                                                self.el.setAttribute("template", options.template.replace("#", ""))
                                            }
                                            if (options.container) {
                                                _.query(options.container).appendChild(self.el);
                                            } else {
                                                document.body.appendChild(self.el);
                                            }
                                            return false;
                                        }
                                        //事件模块
                                        // self.toucher = toucher = toucher(self.el);
                                        break;
                                    case "data":
                                        self.data = options.data;

                                        if (_.isFunction(options.data)) {
                                            self.data = options.data();
                                        }

                                        if (_.isObject(self.data) || _.isArray(self.data)) {

                                            // try {
                                            //     console.log(self.data);
                                            //     var _result = _.clone(self.data);
                                            //     _.keys(self.data).forEach(function(key) {
                                            //         Object.defineProperty(self.data, key, {
                                            //             set: function(newVal) { //监控数据被修改
                                            //                 // var value=x;
                                            //                 console.log(_result[key], key);
                                            //                 var oldVal = _result[key];
                                            //                 console.log(self.data);
                                            //                 console.log("oldVal=" + oldVal);
                                            //                 _result[key] = newVal;
                                            //                 // result[key] = newVal;
                                            //                 console.log("newVal=" + newVal);
                                            //                 if (newVal != oldVal) {
                                            //                     self.apply(key, newVal);
                                            //                 }
                                            //             },
                                            //             get: function() {
                                            //                 console.log(_result[key], key);
                                            //                 return _result[key];
                                            //             },
                                            //             enumerable: true,
                                            //             configurable: true
                                            //         });

                                            //     })
                                            // } catch (e) {
                                            //     console.log(e);

                                            // }

                                        } else {
                                            self.data = {};
                                        }
                                        break;
                                        // case "act":
                                        //     self.act = options.act;
                                        //     break;
                                        // case "keyword":
                                        //     self.keyword = options.keyword;
                                        //     break;
                                        // case "filters":
                                        //     self.filters = options.filters;

                                        //     break;
                                    case "syntax":
                                        self.syntax = customSyntax = options.syntax;
                                        break;

                                    case "methods":
                                        // self.customMethods = _.extend({}, customMethods, v);
                                        self.methods = _.extend({}, customMethods, v);
                                        break;
                                        // case "template":
                                        //     self.tpl = options.template;
                                        //     break;
                                    default:
                                        self[k] = v;
                                        break;
                                }
                            });
                        }
                        break;
                    default:
                        throw new Error("invalid options ,formate should be likes: {el:el,data:data}");
                        break;
                }


                customFilters = _.extend({}, StandardFilters, self.filters);

                StandardDirectives = _.extend({}, StandardDirectives, self.directives);


                self = _.extend({ methods: {} }, self)

                _.each(self.directives, function(fn, key) {
                    self.methods["_on_" + key] = fn;
                })
                options = _.extend({}, options, { el: self.el, methods: self.methods });


                //before render
                _.isFunction(self.before) && self.before.call(self, self.data);
                var el = self.el;
                if (self.act == "cloneBefore") {
                    var cloneEl = _.autoid(self.el.cloneNode(true), true);
                    self.el.parentNode.insertBefore(cloneEl, self.el);
                    options.act = "";
                    el = options.el = cloneEl;

                }
                if (self.act == "cloneAfter") {
                    var cloneEl = _.autoid(self.el.cloneNode(true), true);
                    self.el.parentNode.appendChild(cloneEl, self.el);
                    options.act = "";
                    el = options.el = cloneEl;
                }


                if (_.isElement(el)) {
                    self.parser.call(options, el);
                } else if (_.isArray(el) && _.size(el) > 0) {
                    el.each(function(item, index) {
                        // self.parser.call(options, item);
                        self.parser.call(_.extend({}, options, { el: item }), item);
                    });
                }
                //render ok
                // _.isFunction(self.callback) && self.callback.call(self, self.data);
                _.isFunction(self.callback) && self.callback.call(options, self.data);

                //事件代理
                if (self.events) {
                    if (_.isFunction(self.events)) {
                        toucher({
                            el: el,
                            type: "tap",
                            clear: true,
                            listener: self.events
                        })
                    } else if (_.isObject(self.events)) {
                        var tp = [];
                        for (x in self.events) {
                            tp.push({
                                el: el,
                                type: x,
                                listener: self.events[x]
                            })
                        }
                        toucher(tp);
                    }
                }
            },
            parser: function(el) {
                var self = this;

                if (self.template || _.hasAttr(el, _template) || _.hasAttr(el, _group)) {
                    parseEl.call(self);
                } else {
                    // parseEl.call(templateConfig); //self
                    //只解析[template][group]标签下的模板语言
                    var ts = el.query(_template.brackets(), _group.brackets());
                    if (_.size(ts) > 0) {
                        ts.each(function(item, index) {
                            parseEl.call(_.extend({}, self, { el: item }));
                        });
                    }
                }
            },

            //同步数据 [model]
            apply: function(key, value) {
                var self = this;
                var _kv = function(k, v) {
                    return k + "='" + v + "'";
                }
                var arr = [];
                arr.push(_kv(_model, key).brackets());
                arr.push(_kv(_bind, key).brackets());
                var selector = arr.join(","); //"[" + _model + "='" + key + "'],[" + _bind + "='" + key + "']"
                rootEl.query(selector).each(function(item, index) {
                    console.log(this.tagName, item);
                    switch (this.tagName.toLowerCase()) {
                        case "div":
                            _.query(this).html(value)
                            break;
                        case "input":
                            _.query(this).val(value)
                            break;
                    }
                });
            }
        };
        //继承工具
        template.prototype = _.extend({}, template.prototype, _);
        template.prototype.init.prototype = template.prototype;

        //兼容 jquery
        // if (!_.isJQuery(window.$)) {
        //     window.$ = _.query;
        // }

        //兼容 underscore
        if (!window._) {
            window._ = _;
            // window._ = _.extend({}, window._, _);
        }


        return template;
    }));