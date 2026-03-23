import React, { forwardRef } from "react";
import { Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
// Helper to ensure array mapping
const safeArray = arr => Array.isArray(arr) ? arr : [];

const PlotPurchaseTable = ({ plotData, plotOptions, onRemove, onAdd, onDataChange, isEditMode, isReadOnly, plotDropdownRefs, actualPriceRefs, addButtonRefs }) => {
  const handleChange = (index, field, value) => {
    if (onDataChange) {
      onDataChange(index, field, value);
    }
  };

  // Helper to get or create ref
  const getRef = (refsMap, index) => {
    if (!refsMap.current[index]) {
      refsMap.current[index] = React.createRef();
    }
    return refsMap.current[index];
  };

  // Helper to create callback ref for button
  const getButtonCallbackRef = (refsMap, index) => {
    return (element) => {
      if (refsMap && refsMap.current) {
        if (!refsMap.current[index]) {
          refsMap.current[index] = React.createRef();
        }
        if (element) {
          refsMap.current[index].current = element;
        }
      }
    };
  };

  const calculateTotalAmount = (qty, actualPrice) => {
    const quantity = parseFloat(qty) || 0;
    const price = parseFloat(actualPrice) || 0;
    return quantity * price;
  };

  const getTotalQty = () => {
    return plotData.reduce((sum, item) => {
      return sum + (parseFloat(item.Qty) || 0);
    }, 0);
  };

  const getTotalDueAmount = () => {
    return plotData.reduce((sum, item) => {
      const totalAmount = calculateTotalAmount(item.Qty, item.ActualPrice);
      return sum + totalAmount;
    }, 0);
  };

  return (
    <>
      <div className="table-responsive mt-3">
        <Table bordered hover>
          <thead>
            <tr>
              <th style={{ width: "25%", minWidth: "250px" }}>Plot Name</th>
              <th style={{ width: "12%" }}>Plot Size</th>
              <th style={{ width: "13%" }}>Tentative Price</th>
              <th style={{ width: "10%" }}>Qty</th>
              <th style={{ width: "13%" }}>Actual Price</th>
              <th style={{ width: "13%" }}>Total Amount</th>
              <th style={{ width: "14%", textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {plotData.map((item, index) => {
              // Helper function to normalize IDs for comparison
              const normalizeId = (id) => {
                if (!id || id === "" || id === "0") return null;
                return typeof id === 'string' ? parseInt(id) : id;
              };
              
              // Get all selected plot IDs from other rows (exclude current row)
              const selectedPlotIds = plotData
                .map((row, idx) => idx !== index ? normalizeId(row.F_PlotMaster) : null)
                .filter(id => id !== null);
              
              // Get current row's selected plot ID (normalized)
              const currentPlotId = normalizeId(item.F_PlotMaster);
              
              // Filter plot options to exclude already selected plots in other rows
              const availablePlots = safeArray(plotOptions).filter((plot) => {
                const plotId = normalizeId(plot.Id);
                if (plotId === null) return false;
                // Include current row's selected plot, but exclude others
                return !selectedPlotIds.includes(plotId) || plotId === currentPlotId;
              });

              const plotDropdownRef = plotDropdownRefs ? getRef(plotDropdownRefs, index) : null;
              const actualPriceRef = actualPriceRefs ? getRef(actualPriceRefs, index) : null;
              
              // Get button ref - ensure it's initialized
              if (addButtonRefs && !addButtonRefs.current[index]) {
                addButtonRefs.current[index] = React.createRef();
              }
              const addButtonRef = addButtonRefs ? addButtonRefs.current[index] : null;
              const addButtonCallbackRef = addButtonRefs ? getButtonCallbackRef(addButtonRefs, index) : null;

              return (
              <tr key={index}>
                <td style={{ width: "25%", minWidth: "250px" }}>
                  <select
                    ref={plotDropdownRef}
                    className="form-select"
                    value={item.F_PlotMaster || ""}
                    onChange={(e) => handleChange(index, "F_PlotMaster", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        // Focus on Actual Price in the same row
                        if (actualPriceRef && actualPriceRef.current) {
                          actualPriceRef.current.focus();
                        }
                      }
                    }}
                    disabled={isReadOnly}
                  >
                    <option value="">Select Plot</option>
                    {availablePlots.map((plot) => (
                      <option key={plot.Id} value={plot.Id}>
                        {plot.Name || plot.PlotName || `Plot ${plot.Id}`}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control"
                    value={item.PlotSize}
                    onChange={(e) => handleChange(index, "PlotSize", e.target.value)}
                    disabled={isReadOnly}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control"
                    value={item.TentativePrice}
                    onChange={(e) => handleChange(index, "TentativePrice", e.target.value)}
                    disabled={isReadOnly}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control"
                    value={item.Qty}
                    onChange={(e) => handleChange(index, "Qty", e.target.value)}
                    disabled={isReadOnly}
                  />
                </td>
                <td>
                  <input
                    ref={actualPriceRef}
                    type="number"
                    className="form-control"
                    value={item.ActualPrice}
                    onChange={(e) => handleChange(index, "ActualPrice", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        // Focus on + button in the same row
                        setTimeout(() => {
                          if (addButtonRef && addButtonRef.current) {
                            addButtonRef.current.focus();
                          }
                        }, 50);
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control"
                    value={calculateTotalAmount(item.Qty, item.ActualPrice).toFixed(2)}
                    disabled
                  />
                </td>
                <td style={{ textAlign: "center" }}>
                  <div className="d-flex gap-2 justify-content-center">
                    <div
                      ref={addButtonCallbackRef}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          // Add new row
                          if (onAdd) {
                            onAdd(index);
                          }
                        }
                      }}
                      tabIndex={0}
                      style={{ display: 'inline-block', outline: 'none' }}
                      role="button"
                      aria-label="Add row"
                      onFocus={(e) => {
                        e.target.style.outline = '2px solid #0d6efd';
                        e.target.style.outlineOffset = '2px';
                      }}
                      onBlur={(e) => {
                        e.target.style.outline = 'none';
                      }}
                    >
                      <Btn
                        color="success"
                        size="sm"
                        onClick={() => onAdd && onAdd(index)}
                        className="me-1"
                        disabled={isReadOnly}
                        style={{ pointerEvents: isReadOnly ? 'none' : 'auto' }}
                      >
                        +
                      </Btn>
                    </div>
                    <Btn
                      color="danger"
                      size="sm"
                      onClick={() => onRemove && onRemove(index)}
                      disabled={plotData.length <= 1 || isReadOnly}
                    >
                      -
                    </Btn>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

    </>
  );
};

export default PlotPurchaseTable;
