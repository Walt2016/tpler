##tpler##
一个js开发框架

提供模板，事件，开发调试，画图等功能。


js调用方式：
支持数组 tper([])和对象tper({})
```
tpler({
	el:"#mySwiper",
	data:[{picUrl:"url1"},{picUrl:"url2"}],
	methods:{
		myHandler:function(item,ev){
			console.log(item,ev)
		}
	},
	filters:{
		n_800_600:function(val){
			return val;
		}
	},
	callback:function(){
		
	}
})
```

html：
```
<div class="swiper-wrapper" template="_ppt_tpl" lazy="_ppt_tpl_lazy" id="mySwiper">

 <script type="text/template" id="_ppt_tpl">
     <div class="swiper-slide" style="background-image: url('{=picUrl|n_800_600}');" on="myHandler"></div>
 </script>

 <script type="text/template" id="_ppt_tpl_lazy">
     <div class="swiper-slide">
         <div data-background="{=picUrl|n_800_600}" class="swiper-lazy"></div>
     </div>
 </script>
```


3、事件模块  
移动开发自动切换click到tap模式
```

toucher({
    el: el,
    type: "touchstart",
    callback: function(item, ev) {
    }
})


toucher([{
	el:".btn",
	type:"touchstart",
	callback:function(item,ev){
		item.addClass("active")
	}
},{
	el:".btn",
	type:"touchend",
	callback:function(item,ev){
		item.removeClass("active")
	}
}])
```


4.日志
嵌入调试
```
_.debug()
```




5、几何作图
```
 _.draw({
 	shape:"circle",
 	r:100,
 	color:"rgab(200,200,200,0.2)"
 	})

```

任何反馈意见，可以联系qq22802768