import React, { useState, useRef, useEffect } from 'react';
import { Printer, Plus, Trash2, Layers, Eye } from 'lucide-react';

/**
 * 立體卡片構造師 (Pop-Up Card Builder) - Advanced CSS 3D + 2D CAM
 * 
 * 核心技術：
 * 1. CSS 3D Transforms - 高性能穩定的 3D 渲染（無 WebGL 依賴）
 * 2. Parallel Fold 參數化設計 - 最適合自動化的摺疊技術
 * 3. SVG Pattern 生成 - 自動輸出可列印的刀模（紅=切割線、藍=摺線）
 * 4. 實時同步 - 3D 修改即時反映在 2D 刀模
 */

// ========== 1. CSS 3D 視覺化引擎 ==========
const Css3DViewer = ({ elements, openAmount, viewRotX, viewRotY, onMouseDown }) => {
  const U = 2.5; // 單位縮放：1mm = 2.5px
  const baseWidth = 200 * U;   // 卡片寬：200mm
  const baseHeight = 140 * U;  // 卡片高：140mm
  
  // 背板旋轉角度計算
  // openAmount 0.0 => -180° (完全折疊)
  // openAmount 0.5 => 0° (垂直立起)
  // openAmount 1.0 => 180° (完全展開)
  const backRotation = (openAmount - 0.5) * 360;
  
  return (
    <div 
      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 select-none"
      style={{ perspective: '1500px', cursor: 'grab' }}
      onMouseDown={onMouseDown}
    >
      <div 
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${viewRotX}deg) rotateY(${viewRotY}deg)`,
          width: 0,
          height: 0,
          position: 'relative',
          transition: 'transform 0.05s ease-out'
        }}
      >
        {/* === 底板 (Base Card) === */}
        <div 
          style={{
            position: 'absolute',
            width: baseWidth,
            height: baseHeight,
            background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
            border: '2px solid #cbd5e1',
            left: -baseWidth / 2,
            top: 0,
            transformOrigin: 'top center',
            transform: 'rotateX(90deg)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            backfaceVisibility: 'hidden'
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-5xl font-bold select-none">BASE</div>
          {/* 網格背景 */}
          <svg className="absolute inset-0 w-full h-full opacity-10" style={{pointerEvents: 'none'}}>
            <defs>
              <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="gray" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* === 背板 (Back Card) === */}
        <div 
          style={{
            position: 'absolute',
            width: baseWidth,
            height: baseHeight,
            background: 'linear-gradient(135deg, #f0f0f0 0%, #ffffff 100%)',
            border: '2px solid #cbd5e1',
            left: -baseWidth / 2,
            top: -baseHeight,
            transformOrigin: 'bottom center',
            transform: `rotateX(${backRotation}deg)`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            backfaceVisibility: 'hidden'
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-5xl font-bold select-none">BACK</div>
        </div>

        {/* === 立體方塊元件 === */}
        {elements.map((el) => {
          const boxW = el.width * U;
          const boxH = el.depth * U;
          const boxX = el.x * U;
          
          return (
            <div key={el.id} style={{ transformStyle: 'preserve-3d' }}>
              {/* 前立面 (垂直) */}
              <div
                style={{
                  position: 'absolute',
                  width: boxW,
                  height: boxH,
                  background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                  border: '1px solid #0284c7',
                  left: boxX - boxW / 2,
                  top: -boxH,
                  transformOrigin: 'bottom center',
                  transform: `translateZ(${boxH}px)`,
                  opacity: 0.95,
                  boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.5)'
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-cyan-700 select-none">#{el.id}</div>
              </div>
              
              {/* 頂面 */}
              <div
                style={{
                  position: 'absolute',
                  width: boxW,
                  height: boxH,
                  background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                  border: '1px solid #059669',
                  left: boxX - boxW / 2,
                  top: -boxH,
                  transformOrigin: 'top center',
                  transform: `rotateX(90deg) translateY(-${boxH}px)`,
                  opacity: 0.9,
                  boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.5)'
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-emerald-700 select-none">TOP</div>
              </div>
              
              {/* 左側面 */}
              <div
                style={{
                  position: 'absolute',
                  width: boxH,
                  height: boxH,
                  background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
                  border: '1px solid #d97706',
                  left: boxX - boxW / 2,
                  top: -boxH,
                  transformOrigin: 'bottom left',
                  transform: `rotateY(90deg) translateZ(-${boxH}px)`,
                  opacity: 0.8
                }}
              />
              
              {/* 右側面 */}
              <div
                style={{
                  position: 'absolute',
                  width: boxH,
                  height: boxH,
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  border: '1px solid #0ea5e9',
                  left: boxX + boxW / 2,
                  top: -boxH,
                  transformOrigin: 'bottom right',
                  transform: `rotateY(-90deg) translateZ(-${boxH}px)`,
                  opacity: 0.8
                }}
              />
            </div>
          );
        })}
      </div>
      
      {/* 狀態指示 */}
      <div className="absolute bottom-4 left-4 text-xs font-mono text-gray-400 bg-white/50 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/80">
        3D CSS Engine • {elements.length} box{elements.length !== 1 ? 'es' : ''}
      </div>
    </div>
  );
};

// ========== 2. 2D SVG 刀模生成器 ==========
const PatternGenerator = ({ elements }) => {
  const cardWidth = 300;    // SVG 寬度（單位相對）
  const cardHeight = 420;   // SVG 高度
  const centerX = cardWidth / 2;
  const centerY = cardHeight / 2;
  const scale = 1;          // 1mm = 1單位
  
  return (
    <svg 
      className="w-full h-full bg-white shadow-lg border-2 border-gray-200 rounded-lg" 
      viewBox={`0 0 ${cardWidth} ${cardHeight}`}
      style={{ backgroundColor: '#fafafa' }}
    >
      <defs>
        {/* 網格背景 */}
        <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.3"/>
        </pattern>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect width="50" height="50" fill="url(#smallGrid)"/>
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#d1d5db" strokeWidth="0.5"/>
        </pattern>
      </defs>
      
      {/* 背景網格 */}
      <rect width={cardWidth} height={cardHeight} fill="url(#grid)" />
      
      {/* 卡片外框 */}
      <rect 
        x="10" y="10" 
        width={cardWidth - 20} height={cardHeight - 20} 
        fill="none" 
        stroke="#1f2937" 
        strokeWidth="2"
      />
      
      {/* 中心折線（谷摺 - Valley Fold）*/}
      <g stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.8">
        <line x1="10" y1={centerY} x2={cardWidth - 10} y2={centerY} />
        <text x="15" y={centerY - 8} fontSize="10" fill="#3b82f6" fontWeight="bold">
          Valley Fold (Center)
        </text>
      </g>
      
      {/* 立體元件的刀模 */}
      {elements.map((el, idx) => {
        const xPos = centerX + el.x * scale;
        const halfWidth = (el.width * scale) / 2;
        const depth = el.depth * scale;
        
        // 上下邊界
        const topY = centerY - depth;
        const bottomY = centerY + depth;
        const leftX = xPos - halfWidth;
        const rightX = xPos + halfWidth;
        
        return (
          <g key={el.id}>
            {/* 背景突出顯示 */}
            <rect 
              x={leftX - 2} y={topY - 2} 
              width={halfWidth * 2 + 4} height={depth * 2 + 4}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="0.5"
              opacity="0.3"
              strokeDasharray="2,2"
            />
            
            {/* 垂直切割線（紅色實線）*/}
            <line 
              x1={leftX} y1={topY} x2={leftX} y2={bottomY} 
              stroke="#dc2626" strokeWidth="2" opacity="0.9"
            />
            <line 
              x1={rightX} y1={topY} x2={rightX} y2={bottomY} 
              stroke="#dc2626" strokeWidth="2" opacity="0.9"
            />
            
            {/* 水平摺線（藍色虛線）*/}
            <line 
              x1={leftX} y1={topY} x2={rightX} y2={topY} 
              stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.8"
            />
            <line 
              x1={leftX} y1={bottomY} x2={rightX} y2={bottomY} 
              stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.8"
            />
            
            {/* 上下邊界文字標籤 */}
            <text 
              x={xPos} y={topY - 6} 
              textAnchor="middle" 
              fontSize="9" 
              fill="#2563eb" 
              fontWeight="bold"
            >
              FOLD UP
            </text>
            <text 
              x={xPos} y={bottomY + 15} 
              textAnchor="middle" 
              fontSize="9" 
              fill="#2563eb" 
              fontWeight="bold"
            >
              FOLD DOWN
            </text>
            
            {/* 元件編號和尺寸 */}
            <circle cx={xPos} cy={centerY} r="2" fill="#1f2937" opacity="0.3" />
            <text 
              x={xPos} y={centerY + 4} 
              textAnchor="middle" 
              fontSize="10" 
              fill="#374151" 
              fontWeight="bold"
            >
              #{el.id}
            </text>
            
            {/* 尺寸標註 */}
            <text 
              x={xPos} y={centerY + 20} 
              textAnchor="middle" 
              fontSize="7" 
              fill="#6b7280" 
              fontFamily="monospace"
            >
              W:{el.width} D:{el.depth}
            </text>
          </g>
        );
      })}
      
      {/* 圖例 */}
      <g opacity="0.8">
        <text x="15" y={cardHeight - 35} fontSize="9" fontWeight="bold" fill="#1f2937">Legend:</text>
        
        <line x1="15" y1={cardHeight - 20} x2="35" y2={cardHeight - 20} stroke="#dc2626" strokeWidth="2" />
        <text x="40" y={cardHeight - 16} fontSize="8" fill="#7f1d1d">CUT (Cutting Line)</text>
        
        <line x1="15" y1={cardHeight - 8} x2="35" y2={cardHeight - 8} stroke="#2563eb" strokeWidth="1" strokeDasharray="3,2" />
        <text x="40" y={cardHeight - 4} fontSize="8" fill="#1e40af">FOLD (Valley/Mountain)</text>
      </g>
    </svg>
  );
};

// ========== 3. 主應用程式 ==========
export default function PopUpCardBuilder() {
  // 狀態管理
  const [elements, setElements] = useState([
    { id: 1, x: -30, width: 40, depth: 35 },
    { id: 2, x: 30, width: 35, depth: 40 }
  ]);
  const [selectedId, setSelectedId] = useState(1);
  const [openAmount, setOpenAmount] = useState(0.5); // 0.5 = 90°
  
  // 視角控制
  const [viewRotX, setViewRotX] = useState(-25);
  const [viewRotY, setViewRotY] = useState(35);
  
  // 滑鼠拖曳
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    
    const deltaX = e.clientX - lastMouse.current.x;
    const deltaY = e.clientY - lastMouse.current.y;
    
    setViewRotY(prev => (prev + deltaX * 0.5) % 360);
    setViewRotX(prev => Math.max(-85, Math.min(85, prev - deltaY * 0.5)));
    
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // 元件操作
  const addElement = () => {
    const newId = elements.length > 0 ? Math.max(...elements.map(e => e.id)) + 1 : 1;
    const newEl = { id: newId, x: 0, width: 35, depth: 30 };
    setElements([...elements, newEl]);
    setSelectedId(newId);
  };

  const updateElement = (key, value) => {
    setElements(elements.map(el => 
      el.id === selectedId ? { ...el, [key]: parseFloat(value) || 0 } : el
    ));
  };

  const removeElement = () => {
    if (elements.length > 1) {
      const newEls = elements.filter(e => e.id !== selectedId);
      setElements(newEls);
      setSelectedId(newEls[0].id);
    }
  };

  const selectedElement = elements.find(e => e.id === selectedId) || elements[0];

  return (
    <div 
      className="flex flex-col h-screen bg-slate-100 text-slate-900 font-sans"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 頂部導航 */}
      <header className="bg-white border-b-2 border-slate-200 px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <Layers className="text-indigo-600 w-7 h-7" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">立體卡片構造師</h1>
            <p className="text-xs text-gray-500">Parametric Pop-Up Card Designer • CSS 3D + CAM</p>
          </div>
        </div>
        <button 
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-lg"
          onClick={() => window.print()}
        >
          <Printer size={18} /> 列印刀模
        </button>
      </header>

      {/* 主工作區 */}
      <div className="flex-1 flex overflow-hidden gap-4 p-4">
        
        {/* 左側控制面板 */}
        <div className="w-96 bg-white rounded-lg shadow-lg border-2 border-slate-200 flex flex-col overflow-hidden">
          {/* 面板標題 */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4 text-white font-bold shadow-md">
            設計參數
          </div>
          
          {/* 可滾動內容 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* 卡片動態控制 */}
            <section>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">卡片狀態</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">開合角度</label>
                  <span className="text-lg font-bold text-indigo-600">{Math.round(openAmount * 180)}°</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="1" step="0.01"
                  value={openAmount}
                  onChange={(e) => setOpenAmount(parseFloat(e.target.value))}
                  className="w-full h-2.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                  style={{
                    background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${openAmount * 100}%, #e5e7eb ${openAmount * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 font-mono">
                  <span>📁 Closed</span>
                  <span>📐 90°</span>
                  <span>📖 Flat</span>
                </div>
              </div>
            </section>

            {/* 視角提示 */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
              <p className="text-xs text-blue-800 flex items-center gap-2">
                <Eye size={16} className="flex-shrink-0" />
                <span><strong>提示：</strong>在 3D 預覽區拖曳滑鼠自由旋轉視角。</span>
              </p>
            </div>

            <hr className="border-slate-200" />

            {/* 元件列表 */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">立體元件</h3>
                <button 
                  onClick={addElement} 
                  className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600 hover:text-indigo-700 transition-colors"
                  title="新增元件"
                >
                  <Plus size={22} />
                </button>
              </div>
              
              {/* 元件按鈕列表 */}
              <div className="space-y-2 mb-5">
                {elements.map(el => (
                  <button
                    key={el.id}
                    onClick={() => setSelectedId(el.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                      selectedId === el.id 
                        ? 'bg-indigo-600 text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>方塊元件 #{el.id}</span>
                    {selectedId === el.id && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                  </button>
                ))}
              </div>

              {/* 參數編輯器 */}
              {selectedElement && (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl border-2 border-indigo-200 space-y-5 shadow-sm">
                   
                   {/* 水平位置 */}
                   <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">X 位置</label>
                        <span className="text-sm font-mono font-bold text-indigo-600 bg-white px-2 py-1 rounded">{selectedElement.x}mm</span>
                      </div>
                      <input 
                        type="range" min="-100" max="100" step="5"
                        value={selectedElement.x} 
                        onChange={(e) => updateElement('x', e.target.value)}
                        className="w-full h-2 bg-gray-300 rounded-full appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 font-mono">
                        <span>← Left</span>
                        <span>Center →</span>
                      </div>
                   </div>

                   {/* 寬度 */}
                   <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">寬度</label>
                        <span className="text-sm font-mono font-bold text-indigo-600 bg-white px-2 py-1 rounded">{selectedElement.width}mm</span>
                      </div>
                      <input 
                        type="range" min="10" max="90" step="5"
                        value={selectedElement.width} 
                        onChange={(e) => updateElement('width', e.target.value)}
                        className="w-full h-2 bg-gray-300 rounded-full appearance-none cursor-pointer accent-indigo-600"
                      />
                   </div>

                   {/* 深度/高度 */}
                   <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">深度</label>
                        <span className="text-sm font-mono font-bold text-indigo-600 bg-white px-2 py-1 rounded">{selectedElement.depth}mm</span>
                      </div>
                      <input 
                        type="range" min="10" max="70" step="5"
                        value={selectedElement.depth} 
                        onChange={(e) => updateElement('depth', e.target.value)}
                        className="w-full h-2 bg-gray-300 rounded-full appearance-none cursor-pointer accent-indigo-600"
                      />
                      <p className="text-xs text-gray-600 bg-amber-50 p-2 rounded border-l-2 border-amber-400 mt-2">
                        💡 <strong>深度</strong>決定了方塊從卡片彈出的距離。
                      </p>
                   </div>

                   {/* 刪除按鈕 */}
                   <button 
                     onClick={removeElement}
                     disabled={elements.length === 1}
                     className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
                   >
                     <Trash2 size={16} /> 刪除此元件
                   </button>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* 中心：工作區 */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-w-0">
          
          {/* 3D 預覽 */}
          <div className="flex-1 bg-white rounded-lg shadow-lg border-2 border-slate-200 overflow-hidden relative">
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-gray-700 shadow-md border border-white/50 pointer-events-none">
              🎬 3D 預覽 (拖曳旋轉)
            </div>
            <Css3DViewer 
              elements={elements} 
              openAmount={openAmount} 
              viewRotX={viewRotX}
              viewRotY={viewRotY}
              onMouseDown={handleMouseDown}
            />
            <div 
              onMouseMove={handleMouseMove}
              className="absolute inset-0"
              style={{ cursor: isDragging.current ? 'grabbing' : 'grab', pointerEvents: 'auto' }}
            />
          </div>

          {/* 2D 刀模 */}
          <div className="flex-1 bg-white rounded-lg shadow-lg border-2 border-slate-200 p-6 overflow-auto flex flex-col items-center relative">
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-gray-700 border border-slate-200">
              📋 平面刀模 (SVG)
            </div>
            
            <div className="w-full max-w-sm mt-8">
              <PatternGenerator elements={elements} />
            </div>
            
            {/* 圖例說明 */}
            <div className="mt-6 space-y-3 text-xs text-gray-600 w-full max-w-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-red-500 rounded shadow-sm"></div>
                <span><strong>紅色實線</strong> = 切割線 (Cut)</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-8 h-1" viewBox="0 0 32 4">
                  <line x1="0" y1="2" x2="32" y2="2" stroke="#2563eb" strokeWidth="1" strokeDasharray="3,2" />
                </svg>
                <span><strong>藍色虛線</strong> = 摺線 (Fold)</span>
              </div>
            </div>
            
            {/* 製作指南 */}
            <div className="mt-6 p-4 bg-yellow-50 text-yellow-900 text-xs rounded-lg border-l-4 border-yellow-400 w-full max-w-sm">
              <strong className="block mb-2">📖 製作指南：</strong>
              <ol className="list-decimal list-inside space-y-1">
                <li>列印此頁面到卡紙上。</li>
                <li>用美工刀沿著 <span className="font-bold text-red-600">紅色實線</span> 切開。</li>
                <li>用鋼尺和壓線筆在 <span className="font-bold text-blue-600">藍色虛線</span> 處壓摺痕。</li>
                <li>小心將立體元件推出，卡片成形！</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
