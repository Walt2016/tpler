
2017-11-8
一个js开发框架


简要说明：
也是一个js开发套件，功能包括
模板
事件
路由
日志
解析器(markdown  json 计算)
其他基础工具


展开说明：

1、工具 继承自underscore  + jquery
采用原型扩展方式工作，扩展Element Array strig Number Object，

2、模板解析  parser El ->  tpl -> tag  -> attr 
模板格式 {=field|filter}  
支持：
数组自动循环
filters过滤器 
methods方法 
events事件代理 
driectives自定义指令 
on指令  
model双向绑定 
bind单向绑定 
before预处理 
after/callback 回调处理

js调用方式：
支持数组 tper([])/tper({})

tpler({
	el:"#mySwiper",
	data:[],
	methods:{
		myHandler:function(item,ev){

		}
	},
	filters:{
		n_800_600:function(val){
			//to do
			return val;
		}
	},
	callback:function(){
		
	}
})

html：
// <div class="swiper-wrapper" template="_ppt_tpl" lazy="_ppt_tpl_lazy" id="mySwiper">
// <script type="text/template" id="_ppt_tpl">
//     <div class="swiper-slide" style="background-image: url('{=picUrl|n_800_600}');" on="myHandler"></div>
// </script>
// <script type="text/template" id="_ppt_tpl_lazy">
//     <div class="swiper-slide">
//         <div data-background="{=picUrl|n_800_600}" class="swiper-lazy"></div>
//     </div>
// </script>



3、事件模块  
移动开发自动切换click到tap模式
toucher({
            el: el,
            type: "touchstart",
            callback: function(item, ev) {
            }
        })


4.日志
嵌入调试
logger()

5、路由
var config={}
var r=router(config)
r.go("home")
