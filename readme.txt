编译：

1. 目前编译只支持windows
2. 安装node环境。注：node版本不低于8，目前的最新版本为10.x
3. 克隆前端代码，并保证前端仓库的文件夹名称为“web”。
4. 保证后端仓库的文件夹名称为“server”。
5. 前端和后端的文件夹在同一个父目录下
6. 拷贝“cmd\build.bat”到父目录下。
7. 在父目录下执行“build.bat version”开始编译
8. 生成的目标文件在父目录的back目录下。分别为version.zip 和 version.mock.zip
注：能看到readme，默认server的代码已经被克隆

主站使用：
1. 在使用环境上安装node环境。注：node版本不低于8，目前的最新版本为10.x
2. 新建任意文件夹（路径为英文且无空格）
3. 拷贝version.zip到此目录下，解压version.zip到当前目录
4. 双击start.bat即可开始运行
5. 相关配置文件在config文件夹下

mock使用：
1. 先安装主站
2. 拷贝version.mock.zip到主站录下，解压version.mock.zip到当前目录
3. 双击start_mock.bat即可开始运行
4. 相关的配置文件在mock文件夹下
注： 如果主站和mock在同一台主机，可以在一起运行