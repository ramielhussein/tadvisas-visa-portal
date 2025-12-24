import { useState, useEffect, useCallback, useRef } from 'react';

declare global {
  interface Window {
    qz: any;
  }
}

export interface QZTrayState {
  isLoaded: boolean;
  isConnected: boolean;
  printers: string[];
  selectedPrinter: string | null;
  error: string | null;
}

export const useQZTray = () => {
  const [state, setState] = useState<QZTrayState>({
    isLoaded: false,
    isConnected: false,
    printers: [],
    selectedPrinter: null,
    error: null,
  });
  
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  // Load QZ Tray script
  useEffect(() => {
    const loadQZScript = async () => {
      if (window.qz) {
        setState(prev => ({ ...prev, isLoaded: true }));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.min.js';
      script.async = true;
      
      script.onload = () => {
        setState(prev => ({ ...prev, isLoaded: true }));
      };
      
      script.onerror = () => {
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to load QZ Tray library. Check internet connection.' 
        }));
      };
      
      document.head.appendChild(script);
    };

    loadQZScript();
  }, []);

  // Connect to QZ Tray
  const connect = useCallback(async () => {
    if (!window.qz) {
      setState(prev => ({ 
        ...prev, 
        error: 'QZ Tray library not loaded. Please refresh the page.' 
      }));
      console.error('QZ Tray library not loaded');
      return false;
    }
    
    console.log('Attempting to connect to QZ Tray...');

    try {
      // Check if already connected - if so, still refresh printers list
      const alreadyConnected = window.qz.websocket.isActive();
      if (alreadyConnected) {
        console.log('QZ Tray already connected; refreshing printers list...');
        setState(prev => ({ ...prev, isConnected: true, error: null }));
      }

      // Configure security (for development - in production, use proper certificates)
      window.qz.security.setCertificatePromise(() => {
        return Promise.resolve(
          "-----BEGIN CERTIFICATE-----\n" +
          "MIIEAzCCAuugAwIBAgIJAK6JdQyAPPLkMA0GCSqGSIb3DQEBCwUAMIGXMQswCQYD\n" +
          "VQQGEwJVUzELMAkGA1UECAwCTlkxEjAQBgNVBAcMCU5ldyBZb3JrMRcwFQYDVQQK\n" +
          "DA5RWiBJbmR1c3RyaWVzMRcwFQYDVQQLDA5RWiBJbmR1c3RyaWVzMRQwEgYDVQQD\n" +
          "DAtxemluZHVzdHJpZXMxHzAdBgkqhkiG9w0BCQEWEHFAdXNlcnMuc2YubmV0MB4X\n" +
          "DTE4MDEwMTAwMDAwMFoXDTI4MTIzMTIzNTk1OVowgZcxCzAJBgNVBAYTAlVTMQsw\n" +
          "CQYDVQQIDAJOWTESMBAGA1UEBwwJTmV3IFlvcmsxFzAVBgNVBAoMDlFaIEluZHVz\n" +
          "dHJpZXMxFzAVBgNVBAsMDlFaIEluZHVzdHJpZXMxFDASBgNVBAMMC3F6aW5kdXN0\n" +
          "cmllczEfMB0GCSqGSIb3DQEJARYQcUB1c2Vycy5zZi5uZXQwggEiMA0GCSqGSIb3\n" +
          "DQEBAQUAA4IBDwAwggEKAoIBAQDY87sC1CkNCkXGm0+dFvXFOD0y8f4SH0n0yOLd\n" +
          "M0dBY/rCKvJzLxGY6qTZ2xQfDAIER8u4lY6r3bYL35qPLh9zNQdBEgqf8mJRuxu8\n" +
          "nyDfxY5hNS7g3rJmL6d5ck1zJo7IHxvZMKn0EsEL5g6fCqHM8P4jdJTnuQzE0C8u\n" +
          "5Nja0GPu7dxfddmODfYwTo6k0DuMi9v3x7dDX/5HO6f7+hxO9WVE5G4HkZpLa2qN\n" +
          "0d9j+I7LfJ6n8QWFGQ+JH6w4NpzCT+CLQP3d/5L6F9UadILSzDC9z+FKhQ6znYkz\n" +
          "R0rOlT4y3GNNvHLCGDHmEHJiJ4HqBrC3T4C3jF4HMr3yXLDBAgMBAAGjUzBRMB0G\n" +
          "A1UdDgQWBBQ6k6TzDDC9HxMqq3mpIqPBZS0+wTAfBgNVHSMEGDAWgBQ6k6TzDDC9\n" +
          "HxMqq3mpIqPBZS0+wTAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IB\n" +
          "AQBrPWLX0+qTdAuqXMQJhojI00VgKCJpSo2nBWljsRBmjR+tMFMv5LJEVURz5Dop\n" +
          "0kB5rXFCEHqzPNNW+fT4Hmv3gYKggqVQXyJJEbIxoW3BSQE7E7b0CvDpSTiQNOPX\n" +
          "X6nVIDxTr4X5bZt6W0RYEH0iAaCBY+4eDbXFz+7L00vYELCfPK/1dwPPLu4jL29r\n" +
          "-----END CERTIFICATE-----"
        );
      });

      // NOTE: This follows QZ Tray's expected signature-promise shape:
      // (toSign) => (resolve, reject) => resolve(signature)
      // For local/dev use we resolve with an empty signature to avoid server-side signing.
      window.qz.security.setSignaturePromise((toSign: string) => {
        return (resolve: any, _reject: any) => {
          void toSign;
          resolve('');
        };
      });

      if (!window.qz.websocket.isActive()) {
        await window.qz.websocket.connect();
        console.log('QZ Tray connected successfully');
      } else {
        console.log('QZ Tray already connected');
      }

      // Get available printers
      const printers = await window.qz.printers.find();
      console.log('Found printers:', printers);
      
      // Try to find a thermal printer
      let selectedPrinter = null;
      const thermalKeywords = ['thermal', 'receipt', 'pos', '80mm', 'epson', 'star', 'citizen', 'bixolon', 'xprinter', 'goojprt', 'munbyn'];
      
      for (const printer of printers) {
        const lowerPrinter = printer.toLowerCase();
        if (thermalKeywords.some(keyword => lowerPrinter.includes(keyword))) {
          selectedPrinter = printer;
          break;
        }
      }
      
      // Default to first printer if no thermal found
      if (!selectedPrinter && printers.length > 0) {
        selectedPrinter = printers[0];
      }
      
      console.log('Selected printer:', selectedPrinter);

      setState(prev => ({ 
        ...prev, 
        isConnected: true, 
        printers,
        selectedPrinter,
        error: null 
      }));
      
      reconnectAttempts.current = 0;
      return true;
    } catch (error: any) {
      console.error('QZ Tray connection error:', error);
      
      let errorMessage = 'Failed to connect to QZ Tray. ';
      if (error.message?.includes('Unable to establish')) {
        errorMessage += 'Make sure QZ Tray is running on this computer.';
      } else {
        errorMessage += error.message || 'Unknown error';
      }
      
      setState(prev => ({ 
        ...prev, 
        isConnected: false,
        error: errorMessage 
      }));
      
      return false;
    }
  }, []);

  // Disconnect from QZ Tray
  const disconnect = useCallback(async () => {
    if (window.qz?.websocket?.isActive()) {
      try {
        await window.qz.websocket.disconnect();
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
    }
    setState(prev => ({ ...prev, isConnected: false }));
  }, []);

  // Select printer
  const selectPrinter = useCallback((printerName: string) => {
    setState(prev => ({ ...prev, selectedPrinter: printerName }));
  }, []);

  // Print raw data (for ESC/POS commands)
  const printRaw = useCallback(async (data: string[]) => {
    if (!state.isConnected || !state.selectedPrinter) {
      throw new Error('Printer not connected or selected');
    }

    console.log('Printing to:', state.selectedPrinter);
    console.log('Chunks:', Array.isArray(data) ? data.length : 'not-array');

    // QZ docs recommend sending ESC/POS as an array of raw command strings
    // (not a single joined string).
    const config = window.qz.configs.create(state.selectedPrinter, {
      // Safer for ESC/POS control codes; avoids accidental UTF-8 transformations
      encoding: 'ISO-8859-1',
    });

    const payload = (data || []).filter((chunk) => typeof chunk === 'string');

    if (payload.length === 0) {
      throw new Error('No print data to send');
    }

    await window.qz.print(config, payload);
    console.log('Print job sent successfully');
  }, [state.isConnected, state.selectedPrinter]);

  // Print formatted receipt
  const printReceipt = useCallback(async (receiptData: string[]) => {
    try {
      await printRaw(receiptData);
      return true;
    } catch (error: any) {
      console.error('Print error:', error);
      
      // Try to reconnect if disconnected
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        const reconnected = await connect();
        if (reconnected) {
          return printRaw(receiptData);
        }
      }
      
      throw error;
    }
  }, [printRaw, connect]);

  // Auto-connect when library loads
  useEffect(() => {
    if (state.isLoaded && !state.isConnected) {
      connect();
    }
  }, [state.isLoaded, state.isConnected, connect]);

  // Connection status listener
  useEffect(() => {
    if (!window.qz) return;

    const handleClose = () => {
      setState(prev => ({ ...prev, isConnected: false }));
    };

    window.qz.websocket.setClosedCallbacks?.(handleClose);
    
    return () => {
      window.qz.websocket.setClosedCallbacks?.(() => {});
    };
  }, [state.isLoaded]);

  return {
    ...state,
    connect,
    disconnect,
    selectPrinter,
    printRaw,
    printReceipt,
  };
};
