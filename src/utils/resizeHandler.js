// utils/resizeHandler.js

/**
 * Creates a window resize handler that updates the camera and renderer
 * @param {THREE.PerspectiveCamera} camera - The camera to update on resize
 * @param {THREE.WebGLRenderer} renderer - The renderer to update on resize
 * @returns {function} The resize event handler function
 */
export function createResizeHandler(camera, renderer) {
    const handleResize = () => {
      if (!camera || !renderer) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
  
    return handleResize;
  }
  
  /**
   * Sets up a resize event listener with the provided handler
   * @param {function} handleResize - The resize handler function
   * @returns {function} Cleanup function to remove the event listener
   */
  export function setupResizeListener(handleResize) {
    window.addEventListener('resize', handleResize);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }