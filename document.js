const readFileToURL = (file,onOver)=>{
	var reader = new FileReader();
	reader.onload = ()=>{
		const src = reader.result;
		onOver(src);
	};
	reader.readAsDataURL(file);
};

const readFileAndSetIMGSrc = file=>{
	readFileToURL(file,src=>{
		app.$refs.img.src = src;
	});
};

function chooseFileAndSetImageSrc(){
    chooseFile(readFileAndSetIMGSrc)
}

document.addEventListener('paste',e=>{
	const clipboardData = e.clipboardData;
	if(clipboardData.items[0]){
		let file = clipboardData.items[0].getAsFile();
		if(file && isImageRegex.test(file.type)){
			return readFileAndSetIMGSrc(file);
		}
	}
	if(clipboardData.files.length){
		for(let i = 0;i<clipboardData.files.length;i++){
			if(isImageRegex.test(clipboardData.files[i].type)){
				readFileAndSetIMGSrc(clipboardData.files[i]);
			}
		}
	}
});

document.addEventListener('dragover',e=>{ e.preventDefault(); });
document.addEventListener('drop',e=>{
	e.preventDefault();
	const file = e.dataTransfer.files[0];
	if(file && file.type.match(isImageRegex)){
		readFileAndSetIMGSrc(file);
		return;
	}
});

const chooseFile = callback=>{
	chooseFile.form.reset();
	chooseFile.input.onchange = function(){
		if(!this.files||!this.files[0])return;
		callback(this.files[0]);
	};
	chooseFile.input.click();
};
chooseFile.form = document.createElement('form');
chooseFile.input = document.createElement('input');
chooseFile.input.type = 'file';
chooseFile.input.accept = 'image/*';
chooseFile.form.appendChild(chooseFile.input);

const request = (method,uri,data,callback)=>{
	let body = null;
	if(data){ body = JSON.stringify(data); }
	fetch(uri,{
		method,
		mode: 'cors',
		body,
		credentials: 'include',
		headers: { 'content-type': 'application/json' }
	}).then(res => res.json()).then(data => callback(data)).catch(error => console.error(error))
};

const isGIF = async (src) => {
  return await fetch(src)
    .then(response => response.arrayBuffer())
    .then(arrBuff => new Uint8Array(arrBuff).map(byte => byte.toString(16).padStart(2, '0')).slice(0, 4).join(''))
    .then(str => str === '47494638')
    .catch(() => null)
}

const isImageRegex = /^image\/(.+)$/;
const deepCopy = o=>JSON.parse(JSON.stringify(o));

const STORAGE_KEY = 'cyber_patina_config_v1';

const PRESERVED_KEYS = [
    'watermark', 
    'watermarkSize', 
    'watermarkShadowAlpha', 
    'watermarkDensity', 
    'watermarkLocations',
    'userNames' 
];

let defaultConfig = {
	isPop:false,
	preview:true, 
	pop:4, 
	maxWidth:500,
	zoom: 100,
	mix:1, 
	level: 4, 
	lightNoise:0, 
	darkNoise:0, 
	shiftx:0,
	shifty:0,
	light:0,
	contrast:1, 
	convoluteName:null, 
	quality: 60, 
	green:true, 
	g:0,
	gy:1,
	round: 12,
	rand:true, 
	watermark: true,
	watermarkSize:1,
	watermarkShadowAlpha:.6,
    watermarkDensity: 50,
    watermarkLocations: [true, false, true, false, false, false, true, true, true] 
};

const defaultUserNamesText = `WYFANG.NET
WANGYIFANG.COM
王一方
CSGO.EMAIL
CSGO.LINK
Steam小助手
G胖的微笑
VAC误封申诉
白给少年
RushB指挥官
中门对狙
也就是个大地球
P90_RUSH_B
茂名磨刀石
反恐精英
CNCS最后一根稻草
箱子全蓝
巨龙传说
Steam_客服代表
愿望单又满了
喜加一狂魔
赛博朋克_2077
波兰蠢驴
半条命3发布了吗
Epic送游戏了
显卡吧垃圾佬
图吧钉子户
三千预算进卡吧
一万电脑抱回家
卡吧机务段
战术核显卡
AMD_YES
英伟达负优化
4090燃起来了
索尼今天倒闭了吗
任天堂法务部
华强北装机猿
加拿大白嫖王
极客湾
面向工资编程
头发越少代码越好
删库跑路
颈椎病康复中心
404_Not_Found
Bug制造机
Hello_World
Windows_XP
蓝屏修复工程师
赛博精神病
FPS_优化指南
高刷_144Hz
RGB性能提升100%
败家之眼
键盘侠
祖安文科状元`;

function loadConfig() {
    let savedConfigString = localStorage.getItem(STORAGE_KEY);
    let finalConfig = deepCopy(defaultConfig);
    finalConfig.userNames = defaultUserNamesText.trim().split('\n');
    if (savedConfigString) {
        try {
            const savedConfig = JSON.parse(savedConfigString);
            finalConfig = { ...finalConfig, ...savedConfig };
            if (!finalConfig.watermarkLocations) {
                finalConfig.watermarkLocations = defaultConfig.watermarkLocations;
            }
        } catch (e) {
            console.error('无法读取本地配置，重置为默认', e);
        }
    }
    return finalConfig;
}

let config = loadConfig();
let initialUserNamesText = config.userNames ? config.userNames.join('\n') : defaultUserNamesText;

const defaultImageURL = 'wifi.jpg'; 

const data = {
	src:defaultImageURL,
	defaultImageURL,
	downloadFileName:'WYFANG.NET-Default.jpg',
	output:null,
	img:null,
	direction:'vertical',
	runing:false,
	current:0,
	debug:false,
	config,
	width:400,
	userNamesText: initialUserNamesText,
	superMode:false,
	convoluteNames: ['右倾','左倾','桑拿','浮雕'],
	isGIF: false,
	isLoadingGIF: false,
	isPackingGIF: false,
	lastConfig: {},
    activePreset: 'default',
    applyingPreset: false 
};

const app = new Vue({
	el:'.app',
	data,
	methods:{
		patina(){
            if (this.isGIF) {
                patinaGIF(this.$refs.img,this.config,app)
            } else {
                patina(this.$refs.img,this.config,app)
            }
		},
		_patina(){
			clearTimeout(this.T)
			this.T = setTimeout(this.patina,300)
		},
		async load(){
			const imageEl = this.$refs.img;
            if(!imageEl.complete) return; 

			let _width  = imageEl.naturalWidth;
			let _height = imageEl.naturalHeight;
			let scale = _width / _height;
			let direction = scale > 1.2 ? 'horizontal' : 'vertical';

            this.isGIF = await isGIF(imageEl.src)
			app.direction = direction;
			app.patina();
		},
		chooseFileAndSetImageSrc,
        applyPreset(name, customConfig) {
            if (name === 'default') {
                this.reset();
                return;
            }
            this.applyingPreset = true; 
            
            if (customConfig) {
                for (let key in customConfig) {
                    this.$set(this.config, key, customConfig[key]);
                }
            }
            
            this.activePreset = name;
            if (!this.isGIF) {
                this._patina();
            }
            this.$nextTick(() => {
                this.applyingPreset = false;
            });
        },
		reset(){
			const freshDefault = deepCopy(defaultConfig);
            
            PRESERVED_KEYS.forEach(key => {
                if (this.config.hasOwnProperty(key)) {
                    freshDefault[key] = this.config[key];
                }
            });
            this.applyingPreset = true;
			this.config = freshDefault;
            this.activePreset = 'default';
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
            
            if (!this.isGIF) {
                this._patina();
            }
            this.$nextTick(() => {
                this.applyingPreset = false;
            });
        },
        handleDragStart(e) {
            e.dataTransfer.setData('text/plain', this.output);
            e.dataTransfer.effectAllowed = 'copy';
        },
        handleSourceDrop(e) {
            const file = e.dataTransfer.files[0];
            if(file && file.type.match(isImageRegex)){
                readFileAndSetIMGSrc(file);
                return;
            }
            const internalData = e.dataTransfer.getData('text/plain');
            if (internalData && (internalData.startsWith('data:image') || internalData.startsWith('blob:'))) {
                this.src = internalData;
            }
        },
        recycleOutput() {
            if (this.output) {
                this.src = this.output;
            }
        },
        toggleWatermarkLocation(index) {
            this.$set(this.config.watermarkLocations, index, !this.config.watermarkLocations[index]);
        },
        setAllWatermarkLocations(val) {
            this.config.watermarkLocations = this.config.watermarkLocations.map(() => val);
        },
		save(e){
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const hh = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            
            const dateStr = `${yyyy}${mm}${dd}${hh}${min}${ss}`;
            const ext = this.isGIF ? 'gif' : 'jpg';

			this.downloadFileName = `WYFANG.NET-${dateStr}.${ext}`;
		}
	},
	watch:{
		config:{
			deep:true,
			handler(config){
                if (!this.applyingPreset) {
                    this.activePreset = null;
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
				const maxWidth = config.maxWidth;
				document.documentElement.style.setProperty('--max-width', `${maxWidth}px`);
				if (!this.isGIF) {
                    this._patina();
                }
			}
		},
		userNamesText(text){
            // 修改：如果用户清空了输入框，使用默认列表；否则使用输入框内容
			if (!text || text.trim() === '') {
                this.config.userNames = defaultUserNamesText.trim().split('\n');
            } else {
                this.config.userNames = text.trim().split('\n');
            }
		}
	},
	computed:{
		isShouldRedoGIF () {
            return JSON.stringify(this.lastConfig) !== JSON.stringify(this.config)
        }
	}
})
