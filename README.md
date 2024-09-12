# English Document
[中文文档](https://github.com/826327700/nest-canddy/blob/master/README.zh-CN.md)，如果github访问不了,本页面后半部分为中文文档。
# nest-canddy

`nest-canddy` is a non-intrusive CLI tool that can quickly generate TypeScript SDK code for the frontend to make HTTP requests. It also provides a visual web UI interface to simply display the project module structure.

## Features

- Quickly generate TypeScript SDK code for making RESTful requests on the frontend
- Provide a Web UI visualization interface

## Installation

You can install `nest-canddy` via npm or yarn:

```bash
yarn add -g nest-canddy
//or
npm install -g nest-canddy
```
### As a Server

If you are a server developer using the nestjs framework:

1. Add `nestcanddy.config.js` to the root directory of the nestjs project
```javascript
module.exports = {
    server:{
		port: 13270,//Port number for providing SDK pull service
		outputPath:'./output',//Directory to save the generated SDK
	},
}
```
2. Next, you can generate the frontend TypeScript SDK code.
```bash
nests generate
//or
nests g
```
![nest-canddy-demo-3](https://caidan-1318352346.cos.ap-guangzhou.myqcloud.com/upload/demo/nest-canddy-demo-1.gif)
3. You can also use the Web UI to view and generate the frontend TypeScript SDK code.
```bash
nests server
//or
nests s
```
![nest-canddy-demo-3](https://caidan-1318352346.cos.ap-guangzhou.myqcloud.com/upload/demo/nest-canddy-demo-2.gif)

### As a Client

If you are a frontend developer using TypeScript for any project:

1. Add `nestcanddy.config.js` to the root directory of the nestjs project
```javascript
module.exports = {
	client:{
		host: 'localhost:13270',//Backend SDK service address
		outputPath:'./output',//Relative path to output the SDK in the current project
		httpAdapterPath:'axios',//Path to the HTTP request adapter
		httpAdapterName:'axios'//Name of the HTTP request adapter
	}
}
```
2. Next, you can pull the frontend TypeScript SDK code.
```bash
nestc get
//or
nestc g
```
![nest-canddy-demo-3](https://caidan-1318352346.cos.ap-guangzhou.myqcloud.com/upload/demo/nest-canddy-demo-3.gif)




# 中文文档

# nest-canddy

`nest-canddy` 是一个无侵入代码的CLI工具，它可以快速生成前端可用的TypeScript SDK代码，用于发起http请求。同时，它还提供一个可视化的web ui界面，用于简单的展示项目模块结构。

## 功能

- 快速生成前端用于发起RESTful请求的TypeScript SDK代码
- 提供Web UI可视化界面

## 安装

你可以通过npm或yarn安装`nest-canddy`：

```bash
yarn add -g nest-canddy
//or
npm install -g nest-canddy
```
### 作为服务端

如果你当前的角色是使用nestjs框架的服务器开发人员：

1. 在nestjs的项目根目录下新增`nestcanddy.config.js`
```javascript
module.exports = {
    server:{
		port: 13270,//作为提供SDK拉取服务的端口号
		outputPath:'./output',//生成SDK的保存目录
	},
}
```
2.接下来，你可以生成前端Typescript SDK代码。
```bash
nests generate
//or
nests g
```
![nest-canddy-demo-3](https://caidan-1318352346.cos.ap-guangzhou.myqcloud.com/upload/demo/nest-canddy-demo-1.gif)
3.你也可以使用Web UI来查看和生成生成前端Typescript SDK代码。
```bash
nests server
//or
nests s
```
![nest-canddy-demo-3](https://caidan-1318352346.cos.ap-guangzhou.myqcloud.com/upload/demo/nest-canddy-demo-2.gif)

### 作为客户端

如果你当前的角色是使用Typescript开发任何项目的前端开发人员：

1. 在nestjs的项目根目录下新增`nestcanddy.config.js`
```javascript
module.exports = {
	client:{
		host: 'localhost:13270',//后端提供的SDK服务地址
		outputPath:'./output',//SDK输出到当前项目的相对路径
		httpAdapterPath:'axios',//发起http请求的适配器引用路径
		httpAdapterName:'axios'//发起http请求的适配器引用名称
	}
}
```
2.接下来，你可以拉取前端Typescript SDK代码。
```bash
nestc get
//or
nestc g
```
![nest-canddy-demo-3](https://caidan-1318352346.cos.ap-guangzhou.myqcloud.com/upload/demo/nest-canddy-demo-3.gif)
