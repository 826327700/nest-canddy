module.exports = {
    server:{
		port: 13270,//作为给前端提供SDK拉取服务的端口号
		outputPath:'./ts-sdk',//生成SDK的保存目录 基于当前项目目录
	},
	client:{
		host: 'localhost:13270',//后端提供的SDK服务地址 去掉http
		outputPath:'./output',//SDK输出到当前项目的相对路径
		httpAdapterPath:'axios',//发起http请求的适配器引用路径
		httpAdapterName:'axios',//发起http请求的适配器引用名称
        responseWrapperType:'{IResponse}',//返回类型包裹类型
		responseWrapperTypePath:'@/my-axios-type',//返回类型包裹类型路径
	}
}
