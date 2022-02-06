function webUploader(file, url, headers={}){
    this._tasks = this._init(file);
    this._exeQueue = {};  //执行
    this._status = 'running'; //状态
    this._url = url;
    this._headers = headers;
    this._size = {totalSize: file.size, loadedSize: 0};

    document.getElementById('progress').innerHTML = '0%' + '&nbsp;';
    this._run();
}

webUploader.prototype._init = function (file) {
    //返回文件切割的可迭代对象 
    let tasks = [];
    let index = 0;
    const SIZE = 20 * 1024 * 1024;
    while(index < file.size) {
        tasks.push({name: file.name + '_' + (index / SIZE + 1), file: file.slice(index, index + SIZE)});
        index += SIZE;
    }
    return tasks;
}


webUploader.prototype._run = async function () {
    //分配task资源
    let queue = [];
    this._exeQueue = {};
    for(task of this._tasks) {
        if(!sessionStorage.getItem(task.name) || sessionStorage.getItem(task.name)!='done') {
            let formData = new FormData();
            formData.append('name', task.name);
            formData.append('file', task.file);
            queue.push(this._request({url: this._url, formData: formData, headers: this._headers, exeQueue: this._exeQueue}));
        }
    }
    Promise.all(queue).then( value => {
        console.log('上传完毕');
    }).catch (value => {
        console.log('上传失败');
    });
}

webUploader.prototype.pause = function() {
    if ( this._status == 'running') {
        this._status = 'waiting';
        for(key in this._exeQueue) {
            this._exeQueue[key].abort();
        }
        this._exeQueue = {};
        console.log('已暂停');
    } else if( this._status == 'waiting') {
        this._status = 'running';
        console.log('已重启');
        this._run();
    } else {
    }
}

webUploader.prototype.cancel = function () {
    if(this._status != 'ending'){
        this._status = 'running';
        this.pause();
        this._status = 'ending';
        this._tasks.forEach( el=> {
            sessionStorage.removeItem(el.name);
        });
        this._tasks = [];
        this._url = '';
        this._headers = {};
        this._size = {totalSize: undefined, loadedSize: undefined};
        document.getElementById('progress').innerHTML = '0%' + '&nbsp;';
        console.log('已取消');
    }
}


webUploader.prototype._request = function({url, formData, headers, exeQueue}) {
    return new Promise( (resolve, reject) => {
        let name = formData.get('name')
        xhr = new XMLHttpRequest();
        xhr.upload.onprogress = this._progressUpdate(this._size);
        xhr.open('post', url);
        Object.keys(headers).forEach( key => {
            xhr.setRequestHeader(key, headers[key])
        });
        xhr.send(formData);
        xhr.onload = e => {
            // 上传完成后用sessionStore 存储任务信息
            sessionStorage.setItem(name, 'done');
            resolve(
                {
                    data: e.target.response
                }
            );
            delete exeQueue[name];
        }
        xhr.onerror = e => {
            reject('error')
        }

        exeQueue[name] = xhr;
    } )
}

webUploader.prototype._progressUpdate = function (size) {
    let oldloaded = 0;
    return e => {
        let progress_dom = document.getElementById('progress');     //测试就直接获取了，简单些
        size.loadedSize += (e.loaded-oldloaded);
        oldloaded = e.loaded;
        progress_dom.innerHTML = Math.floor(( size.loadedSize / size.totalSize) * 100) + '%' + '&nbsp;';
    }
}