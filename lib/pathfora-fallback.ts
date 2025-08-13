/**
 * Pathfora Fallback - Simple widgets when Pathfora script isn't available
 * This provides basic functionality while we get the full Pathfora integration working
 */

import { getUserTopInterests } from './user-interests';

export class PathforaFallback {
  private initialized: boolean = false;

  /**
   * Initialize fallback widgets using simple HTML/CSS
   */
  initialize(): void {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    this.initialized = true;
    console.log('🎨 Pathfora Fallback: Using simple HTML widgets');

    // Setup fallback widgets after a delay
    setTimeout(() => {
      this.setupFallbackWidgets();
    }, 3000); // Wait 3 seconds before showing widgets
  }

  /**
   * Setup simple HTML-based widgets
   */
  private setupFallbackWidgets(): void {
    const userInterests = getUserTopInterests(1);
    
    if (userInterests.length > 0) {
      this.createSimpleInterestWidget(userInterests[0]);
    }

    // Setup exit intent using multiple detection methods
    this.setupExitIntentDetection();
  }

  /**
   * Setup enhanced exit intent detection
   */
  private setupExitIntentDetection(): void {
    console.log('🎨 Pathfora Fallback: Setting up exit intent detection');
    
    // Method 1: Mouse leave detection
    document.addEventListener('mouseleave', this.handleExitIntent.bind(this));
    
    // Method 2: Mouse move to top edge
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
    // Method 3: Keyboard shortcut (Ctrl+W / Cmd+W simulation)
    document.addEventListener('keydown', this.handleKeyboardShortcut.bind(this));
  }

  /**
   * Handle mouse movement for exit intent
   */
  private handleMouseMove(event: MouseEvent): void {
    // Trigger if mouse is very close to top edge
    if (event.clientY <= 5 && event.clientY >= 0) {
      console.log('🎨 Pathfora Fallback: Exit intent detected via mouse move');
      this.createExitIntentWidget();
      // Remove listeners after first trigger
      this.removeExitIntentListeners();
    }
  }

  /**
   * Handle keyboard shortcuts that might indicate exit intent
   */
  private handleKeyboardShortcut(event: KeyboardEvent): void {
    // Detect Ctrl+W (Windows) or Cmd+W (Mac) - tab close shortcuts
    if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
      console.log('🎨 Pathfora Fallback: Exit intent detected via keyboard shortcut');
      event.preventDefault(); // Prevent the actual tab close for demo
      this.createExitIntentWidget();
      this.removeExitIntentListeners();
    }
  }

  /**
   * Remove all exit intent listeners
   */
  private removeExitIntentListeners(): void {
    document.removeEventListener('mouseleave', this.handleExitIntent);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('keydown', this.handleKeyboardShortcut);
  }

  /**
   * Create simple interest-based widget
   */
  private createSimpleInterestWidget(interest: string): void {
    // Check if widget already exists
    if (document.getElementById('simple-pathfora-widget')) {
      return;
    }

    const widget = document.createElement('div');
    widget.id = 'simple-pathfora-widget';
    widget.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4F46E5, #7C3AED);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 300px;
        font-family: system-ui, -apple-system, sans-serif;
        cursor: pointer;
        transition: transform 0.2s ease;
      " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <div style="font-weight: 600; margin-bottom: 8px;">
          🎯 More ${interest.charAt(0).toUpperCase() + interest.slice(1)} Content
        </div>
        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 12px;">
          Discover the latest ${interest} articles curated for you
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="pathfora-explore" style="
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            transition: background 0.2s;
          ">Explore Now</button>
          <button id="pathfora-dismiss" style="
            background: transparent;
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            transition: background 0.2s;
          ">Maybe Later</button>
        </div>
      </div>
    `;

    document.body.appendChild(widget);

    // Add click handlers
    const exploreBtn = document.getElementById('pathfora-explore');
    const dismissBtn = document.getElementById('pathfora-dismiss');

    if (exploreBtn) {
      exploreBtn.addEventListener('click', () => {
        window.location.href = `/blog?search=${encodeURIComponent(interest)}`;
      });
    }

    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        this.dismissWidget('simple-pathfora-widget');
      });
    }

    console.log('🎨 Pathfora Fallback: Simple interest widget created for:', interest);
  }

  /**
   * Handle exit intent
   */
  private handleExitIntent(event: MouseEvent): void {
    // Trigger if mouse leaves from the top or moves to a very low Y position
    if (event.clientY <= 10 || event.clientY < 0) {
      console.log('🎨 Pathfora Fallback: Exit intent detected via mouse leave');
      this.createExitIntentWidget();
      // Remove all listeners after first trigger
      this.removeExitIntentListeners();
    }
  }

  /**
   * Create exit intent widget
   */
  private createExitIntentWidget(): void {
    // Check if already shown or dismissed
    if (document.getElementById('exit-intent-widget') || 
        localStorage.getItem('pathfora-exit-dismissed')) {
      return;
    }

    // Add CSS animations if not already added
    if (!document.getElementById('pathfora-animations')) {
      const style = document.createElement('style');
      style.id = 'pathfora-animations';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    const userInterests = getUserTopInterests(1);
    const interest = userInterests[0] || 'development';

    const overlay = document.createElement('div');
    overlay.id = 'exit-intent-widget';
    overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4px);
        animation: fadeIn 0.3s ease-out;
      ">
        <div style="
          background: linear-gradient(135deg, #ffffff, #f8fafc);
          padding: 40px;
          border-radius: 20px;
          max-width: 450px;
          margin: 20px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          border: 2px solid #DC2626;
          animation: slideUp 0.4s ease-out;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <div style="font-size: 24px; margin-bottom: 16px;">⏰ Wait! Before You Go...</div>
          <div style="color: #666; margin-bottom: 24px; line-height: 1.5;">
            Don't miss out on the latest ${interest} insights. Join our community of developers!
          </div>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="exit-explore" style="
              background: #4F46E5;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.2s;
            ">Show Me More</button>
            <button id="exit-dismiss" style="
              background: #f3f4f6;
              color: #374151;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.2s;
            ">No Thanks</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Add click handlers
    const exploreBtn = document.getElementById('exit-explore');
    const dismissBtn = document.getElementById('exit-dismiss');

    if (exploreBtn) {
      exploreBtn.addEventListener('click', () => {
        window.location.href = `/blog?search=${encodeURIComponent(interest)}`;
      });
    }

    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        localStorage.setItem('pathfora-exit-dismissed', 'true');
        this.dismissWidget('exit-intent-widget');
      });
    }

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      this.dismissWidget('exit-intent-widget');
    }, 10000);

    console.log('🎨 Pathfora Fallback: Exit intent widget created');
  }

  /**
   * Dismiss a widget
   */
  private dismissWidget(widgetId: string): void {
    const widget = document.getElementById(widgetId);
    if (widget) {
      widget.style.opacity = '0';
      widget.style.transform = 'scale(0.9)';
      widget.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      
      setTimeout(() => {
        widget.remove();
      }, 300);
    }
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
let fallbackInstance: PathforaFallback | null = null;

/**
 * Initialize fallback Pathfora
 */
export function initPathforaFallback(): PathforaFallback {
  if (!fallbackInstance) {
    fallbackInstance = new PathforaFallback();
    fallbackInstance.initialize();
  }
  return fallbackInstance;
}

/**
 * Get fallback instance
 */
export function getPathforaFallbackInstance(): PathforaFallback | null {
  return fallbackInstance;
}
