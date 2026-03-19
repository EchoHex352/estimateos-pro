import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Plus, Edit3, Trash2, FileText, CheckSquare, Square, ChevronDown, ChevronRight, Save, Send, Database } from 'lucide-react';

// CSI Division Data
const CSI_DIVISIONS = [
  { group: 'General Requirements', divisions: [
    { id: '00', name: 'Procurement and Contracting', color: '#FF6B6B' },
    { id: '01', name: 'General Requirements', color: '#FF8E53' }
  ]},
  { group: 'Facility Construction', divisions: [
    { id: '02', name: 'Existing Conditions', color: '#4ECDC4' },
    { id: '03', name: 'Concrete', color: '#95E1D3' },
    { id: '04', name: 'Masonry', color: '#F38181' },
    { id: '05', name: 'Metals', color: '#AA96DA' },
    { id: '06', name: 'Wood, Plastics, and Composites', color: '#FCBAD3' },
    { id: '07', name: 'Thermal and Moisture Protection', color: '#A8D8EA' },
    { id: '08', name: 'Openings', color: '#FFD93D' },
    { id: '09', name: 'Finishes', color: '#6BCB77' },
    { id: '10', name: 'Specialties', color: '#4D96FF' },
    { id: '11', name: 'Equipment', color: '#FFB6B9' },
    { id: '12', name: 'Furnishings', color: '#FEC8D8' },
    { id: '13', name: 'Special Construction', color: '#957DAD' },
    { id: '14', name: 'Conveying Equipment', color: '#D4A5A5' }
  ]},
  { group: 'Facility Services', divisions: [
    { id: '20', name: 'Mechanical Support', color: '#FF9A8B' },
    { id: '21', name: 'Fire Suppression', color: '#FF6A88' },
    { id: '22', name: 'Plumbing', color: '#4A90E2' },
    { id: '23', name: 'HVAC', color: '#F6A192' },
    { id: '25', name: 'Integrated Automation', color: '#9B59B6' },
    { id: '26', name: 'Electrical', color: '#F1C40F' },
    { id: '27', name: 'Communications', color: '#3498DB' },
    { id: '28', name: 'Electronic Safety and Security', color: '#E74C3C' }
  ]},
  { group: 'Site and Infrastructure', divisions: [
    { id: '31', name: 'Earthwork', color: '#8B4513' },
    { id: '32', name: 'Exterior Improvements', color: '#A9A9A9' },
    { id: '33', name: 'Utilities', color: '#2C3E50' },
    { id: '34', name: 'Transportation', color: '#34495E' },
    { id: '35', name: 'Waterway and Marine', color: '#1ABC9C' }
  ]},
  { group: 'Process Equipment', divisions: [
    { id: '40', name: 'Process Interconnections', color: '#7F8C8D' },
    { id: '41', name: 'Material Processing', color: '#95A5A6' },
    { id: '42', name: 'Process Heating/Cooling', color: '#BDC3C7' },
    { id: '43', name: 'Gas and Liquid Handling', color: '#D35400' },
    { id: '44', name: 'Pollution Control', color: '#27AE60' },
    { id: '45', name: 'Manufacturing Equipment', color: '#8E44AD' },
    { id: '46', name: 'Water/Wastewater', color: '#2980B9' },
    { id: '48', name: 'Power Generation', color: '#C0392B' }
  ]}
];

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDivisions, setSelectedDivisions] = useState(new Set());
  const [annotations, setAnnotations] = useState([]);
  const [materialLegend, setMaterialLegend] = useState({});
  const [quantityData, setQuantityData] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [selectedTool, setSelectedTool] = useState('select'); // select, rect, line, note
  const [expandedGroups, setExpandedGroups] = useState(new Set(['Facility Construction']));
  const [sidebarTab, setSidebarTab] = useState('divisions'); // divisions, legend, data
  const canvasRef = useRef(null);

  // Handle PDF upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      // In production, this would trigger PDF processing
      generateMockData();
    }
  };

  // Generate mock data for demonstration
  const generateMockData = () => {
    const mockAnnotations = [
      { id: 1, page: 1, type: 'rect', x: 100, y: 150, width: 200, height: 100, division: '03', material: 'Concrete Slab', color: '#95E1D3', quantity: 1200, unit: 'SF' },
      { id: 2, page: 1, type: 'rect', x: 350, y: 200, width: 150, height: 80, division: '04', material: 'CMU Block Wall', color: '#F38181', quantity: 450, unit: 'SF' },
      { id: 3, page: 1, type: 'rect', x: 150, y: 350, width: 180, height: 60, division: '08', material: 'Hollow Metal Door', color: '#FFD93D', quantity: 3, unit: 'EA' },
    ];
    setAnnotations(mockAnnotations);

    const mockLegend = {
      1: [
        { division: '03', color: '#95E1D3', items: ['Concrete Slab - 6" thick', 'Footing - 24"x12"'] },
        { division: '04', color: '#F38181', items: ['CMU Block Wall - 8"', 'Brick Veneer'] },
        { division: '08', color: '#FFD93D', items: ['Hollow Metal Door 3\'x7\'', 'Aluminum Window'] },
      ]
    };
    setMaterialLegend(mockLegend);

    const mockQuantity = [
      { id: 1, division: '03', material: 'Concrete Slab - 6" thick', quantity: 1200, unit: 'SF', laborHrs: 24, materialCost: 3600, laborCost: 2400, total: 6000 },
      { id: 2, division: '03', material: 'Footing - 24"x12"', quantity: 180, unit: 'LF', laborHrs: 18, materialCost: 1080, laborCost: 1800, total: 2880 },
      { id: 3, division: '04', material: 'CMU Block Wall - 8"', quantity: 450, unit: 'SF', laborHrs: 45, materialCost: 2250, laborCost: 4500, total: 6750 },
      { id: 4, division: '04', material: 'Brick Veneer', quantity: 320, unit: 'SF', laborHrs: 38, materialCost: 2560, laborCost: 3800, total: 6360 },
      { id: 5, division: '08', material: 'Hollow Metal Door 3\'x7\'', quantity: 3, unit: 'EA', laborHrs: 6, materialCost: 1500, laborCost: 600, total: 2100 },
      { id: 6, division: '08', material: 'Aluminum Window', quantity: 12, unit: 'EA', laborHrs: 18, materialCost: 4800, laborCost: 1800, total: 6600 },
    ];
    setQuantityData(mockQuantity);
  };

  // Toggle division selection
  const toggleDivision = (divisionId) => {
    const newSelected = new Set(selectedDivisions);
    if (newSelected.has(divisionId)) {
      newSelected.delete(divisionId);
    } else {
      newSelected.add(divisionId);
    }
    setSelectedDivisions(newSelected);
  };

  // Toggle group expansion
  const toggleGroup = (groupName) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  // Export to Excel
  const exportToExcel = () => {
    const csvContent = [
      ['Division', 'Material', 'Quantity', 'Unit', 'Labor Hours', 'Material Cost', 'Labor Cost', 'Total Cost'],
      ...quantityData.map(item => [
        item.division,
        item.material,
        item.quantity,
        item.unit,
        item.laborHrs,
        `$${item.materialCost}`,
        `$${item.laborCost}`,
        `$${item.total}`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quantity_takeoff.csv';
    a.click();
  };

  // Generate RFQ
  const generateRFQ = () => {
    const rfqContent = `
REQUEST FOR QUOTATION
Date: ${new Date().toLocaleDateString()}
Project: [Project Name]

MATERIALS REQUIRED:

${quantityData.map((item, idx) => `
${idx + 1}. Division ${item.division} - ${item.material}
   Quantity: ${item.quantity} ${item.unit}
`).join('\n')}

Please provide pricing for the above materials.
Deadline: [Date]
    `.trim();

    const blob = new Blob([rfqContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rfq.txt';
    a.click();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#fff'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        padding: '1rem 2rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '1.8rem',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            EstimateOS Pro
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.7 }}>
            Enterprise Construction Estimating Platform
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={exportToExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              background: '#10b981',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Download size={16} />
            Export Excel
          </button>

          <button
            onClick={generateRFQ}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              background: '#f59e0b',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Send size={16} />
            Generate RFQ
          </button>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            background: '#6366f1',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <Upload size={16} />
            Upload Plans
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </header>

      <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
        {/* Sidebar */}
        <aside style={{
          width: '380px',
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Sidebar Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0, 0, 0, 0.2)'
          }}>
            {[
              { id: 'divisions', label: 'Divisions', icon: CheckSquare },
              { id: 'legend', label: 'Legend', icon: Database },
              { id: 'data', label: 'Data', icon: FileText }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSidebarTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: sidebarTab === tab.id ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                  border: 'none',
                  borderBottom: sidebarTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sidebar Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
            {sidebarTab === 'divisions' && (
              <div>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '700' }}>
                  Select CSI Divisions
                </h3>
                {CSI_DIVISIONS.map(group => (
                  <div key={group.group} style={{ marginBottom: '1rem' }}>
                    <button
                      onClick={() => toggleGroup(group.group)}
                      style={{
                        width: '100%',
                        padding: '0.625rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}
                    >
                      {group.group}
                      {expandedGroups.has(group.group) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    
                    {expandedGroups.has(group.group) && (
                      <div style={{ paddingLeft: '0.5rem' }}>
                        {group.divisions.map(div => (
                          <button
                            key={div.id}
                            onClick={() => toggleDivision(div.id)}
                            style={{
                              width: '100%',
                              padding: '0.625rem',
                              background: selectedDivisions.has(div.id) ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                              border: selectedDivisions.has(div.id) ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '6px',
                              color: '#fff',
                              fontSize: '0.8125rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.625rem',
                              marginBottom: '0.375rem',
                              transition: 'all 0.2s',
                              textAlign: 'left'
                            }}
                          >
                            {selectedDivisions.has(div.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                            <div
                              style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '3px',
                                background: div.color,
                                flexShrink: 0
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: '600' }}>{div.id}</div>
                              <div style={{ fontSize: '0.75rem', opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {div.name}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {sidebarTab === 'legend' && (
              <div>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '700' }}>
                  Page {currentPage} Legend
                </h3>
                {materialLegend[currentPage]?.map((legendItem, idx) => (
                  <div key={idx} style={{
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        background: legendItem.color,
                        flexShrink: 0
                      }} />
                      <span style={{ fontWeight: '700', fontSize: '0.875rem' }}>Division {legendItem.division}</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.8125rem', lineHeight: '1.6' }}>
                      {legendItem.items.map((item, itemIdx) => (
                        <li key={itemIdx} style={{ marginBottom: '0.25rem' }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {sidebarTab === 'data' && (
              <div>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '700' }}>
                  Quantity Takeoff Summary
                </h3>
                <div style={{ fontSize: '0.8125rem' }}>
                  {quantityData.map(item => (
                    <div key={item.id} style={{
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ fontWeight: '700', marginBottom: '0.375rem' }}>
                        Div {item.division} - {item.material}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', opacity: 0.8 }}>
                        <div>Qty: {item.quantity} {item.unit}</div>
                        <div>Labor: {item.laborHrs} hrs</div>
                        <div>Material: ${item.materialCost}</div>
                        <div>Total: ${item.total}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>Tools:</div>
            {[
              { id: 'select', label: 'Select', icon: '↖' },
              { id: 'rect', label: 'Rectangle', icon: '□' },
              { id: 'line', label: 'Line', icon: '/' },
              { id: 'note', label: 'Note', icon: 'T' }
            ].map(tool => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                style={{
                  padding: '0.5rem 1rem',
                  background: selectedTool === tool.id ? '#6366f1' : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '1.125rem' }}>{tool.icon}</span>
                {tool.label}
              </button>
            ))}
          </div>

          {/* PDF Viewer Area */}
          <div style={{
            flex: 1,
            background: '#1a1a2e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
            position: 'relative'
          }}>
            {pdfFile ? (
              <div style={{
                position: 'relative',
                background: '#fff',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
              }}>
                {/* Canvas for annotations */}
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={1000}
                  style={{
                    width: '800px',
                    height: '1000px',
                    cursor: selectedTool === 'select' ? 'default' : 'crosshair'
                  }}
                />
                
                {/* Render annotations */}
                {annotations.filter(a => a.page === currentPage).map(ann => (
                  <div
                    key={ann.id}
                    style={{
                      position: 'absolute',
                      left: `${ann.x}px`,
                      top: `${ann.y}px`,
                      width: `${ann.width}px`,
                      height: `${ann.height}px`,
                      border: `3px solid ${ann.color}`,
                      background: `${ann.color}20`,
                      borderRadius: '4px',
                      pointerEvents: selectedTool === 'select' ? 'auto' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '-28px',
                      left: '0',
                      background: ann.color,
                      color: '#000',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      whiteSpace: 'nowrap'
                    }}>
                      {ann.material} ({ann.quantity} {ann.unit})
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <Upload size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  No plans uploaded
                </p>
                <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>
                  Upload a PDF to begin quantity takeoff
                </p>
              </div>
            )}
          </div>

          {/* Page Navigation */}
          {pdfFile && (
            <div style={{
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(10px)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem'
            }}>
              <button style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Previous
              </button>
              <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                Page {currentPage} of 15
              </span>
              <button style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
