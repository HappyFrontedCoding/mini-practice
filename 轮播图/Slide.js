function Slide(dom, data) {

    let app, width, height, dataBox, _index, timer, timeout;

    function _create() {

        if (dom == null || data == null || data.length < 2) {
            throw new Error('create失败');
        }

        app = document.getElementById(dom);
        app.style.cssText = 'overflow: hidden';
        appStyle = getComputedStyle(app);
        width = parseInt(appStyle.width);
        height = parseInt(appStyle.height);
        dataBox = document.createElement('div');
        _index = 0;

        dataBox.style.cssText = `
            position: relative;
            height: ${height}px;
            width: ${(data.length + 1) * width}px;
        `;

        imgCSS = `
            width: ${width}px;
            height: ${height}px;
            float: left;
        `

        data.forEach(img => {
            let el = document.createElement('img');
            el.src = img;
            el.style.cssText = imgCSS;
            dataBox.appendChild(el);
        });

        let el = document.createElement('img');
        el.src = data[0];
        el.style.cssText = imgCSS;
        dataBox.appendChild(el);

        app.appendChild(dataBox);

    }

    function _move(distance, animation) {
        dataBox.style.transition = animation ? 'transform .5s' : 'none';
        dataBox.style.transform = `translateX(${distance}px)`;
    }

    function _autoPlay() {
        clearTimeout(timer);
        timer = setTimeout(() => {
            next();
            _autoPlay();
        }, timeout);
    }

    function update(new_index) {

        if (new_index < 0) {
            new_index = data.length - 1;
            _move(-width * data.length, false);
            _index = 0;
            dataBox.offsetWidth;
        }

        if (new_index > data.length) {
            new_index = 1;
            _move(0, false);
            _index = 0;
            dataBox.offsetWidth;
        }
        
        _move(-new_index * width, true);
        _index = new_index;

        return (_index % data.length);
    }

    function next() {
        return update(_index + 1);
    }

    function pre() {
        return update(_index - 1);
    }

    function setTime(ms = 1000) {
        let start = () => { _autoPlay() }
        let end = () => { clearTimeout(timer) }

        if (ms == -1) {
            app.removeEventListener('mouseover', end);
            app.removeEventListener('mouseleave', start);
            end();
        } else {
            timeout = ms < 500 ? 1000 : ms;
            app.addEventListener('mouseover', end);
            app.addEventListener('mouseleave', start);
            start();
        }
    }

    _create();

    return { next, pre, update, setTime }; //setTime输入-1表示关闭动画
}