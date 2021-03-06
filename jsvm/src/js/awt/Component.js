/**

 Copyright 2010-2011, The JSVM Project. 
 All rights reserved.
 
 Redistribution and use in source and binary forms, with or without modification, 
 are permitted provided that the following conditions are met:
 
 1. Redistributions of source code must retain the above copyright notice, 
 this list of conditions and the following disclaimer.
 
 2. Redistributions in binary form must reproduce the above copyright notice, 
 this list of conditions and the following disclaimer in the 
 documentation and/or other materials provided with the distribution.
 
 3. Neither the name of the JSVM nor the names of its contributors may be 
 used to endorse or promote products derived from this software 
 without specific prior written permission.
 
 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 
 IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, 
 INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, 
 BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, 
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF 
 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE 
 OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 OF THE POSSIBILITY OF SUCH DAMAGE.

 *
 * Author: Hu Dong
 * Contact: jsvm.prj@gmail.com
 * License: BSD 3-Clause License
 * Source code availability: http://jzvm.googlecode.com
 */

$package("js.awt");

$import("js.awt.BaseComponent");
$import("js.awt.Editable");
$import("js.awt.Movable");
$import("js.awt.PopupLayer");
$import("js.awt.Resizable");
$import("js.awt.State");
$import("js.awt.Shadow");
$import("js.util.Observer");

/**
 * A <em>component</em> is an object having a graphical representation
 * that can be displayed in the browser and that can interact with the
 * user.<p>
 * 
 * The <em>model</em> of a <em>component</em> as below:<p>
 *@param def : {
 *     classType : class type of this component
 *     id : string to identify a component
 *     
 * 
 *     x : position left,
 *     y : position top,
 *     width : outer width of the componet,
 *     height: outer height of the component,
 *     miniSize: {width, height},
 *     maxiSize: {width, height},
 *     prefSize: {width, height},
 *     rigid_w: true|false
 *     rigid_h: true|false  
 *     align_x: 0.0|0.5|1.0
 *     align_y: 0.0|0.5|1.0
 *     
 *     className : style class
 *     css: css text
 * 
 *     state : number, see also <code>js.util.State</code>
 *     
 *     mover : {delay, bound ...}, see also <code>js.awt.Movable</code>
 *     movable : true/false,
 *     
 *     resizer : 8 bits number to define 8 directions resize, see also 
 *               <code>js.awt.Resizable</code>,
 *     resizable : true/false
 * 
 *     alwaysOnTop: true/false
 * }<p>
 * 
 * The <em>Runtime</em> is runtime context, it may includes:
 * @param Runtime :{
 *     imgPath : The image path,
 *     ...
 * }<p>
 * 
 * When new a <em>component</em> will create a DIV element as the <em>View</em>
 * of this component. But you also can use an existing view to instead of the
 * view.
 * @param view,  a document element  
 */
js.awt.Component = function (def, Runtime, view){

    var ccount = 0;
    
    var CLASS = js.awt.Component, thi$ = CLASS.prototype;
    if(CLASS.__defined__){
        this._init.apply(this, arguments);
        return;
    }
    CLASS.__defined__ = true;
    
    var Class = js.lang.Class, Event = js.util.Event, DOM = J$VM.DOM,
    System = J$VM.System, MQ = J$VM.MQ;

    /**
     * Set position of the component.<p>
     * 
     * @param x, the position left
     * @param y, the position top
     * @param fire       1: raise <em>moved</em>  event
     *                   2: doLayout
     *                   4: set this position as original position
     */
    thi$.setPosition = function(x, y, fire){
        var M = this.def, U = this._local;

        arguments.callee.__super__.apply(this, arguments);

        fire = !Class.isNumber(fire) ? 0 : fire;

        if((fire & 0x04) != 0){
            U.userX = M.x;
            U.userY = M.y;
        }

        if((fire & 0x01) != 0){
            this.onMoved(fire);            
        }

    }.$override(this.setPosition);
    
    /**
     * Set css z-index of the component.<p>
     * 
     * @param z
     * @param fire
     */
    thi$.setZ = function(z, fire){
        var M = this.def, U = this._local;
        
        arguments.callee.__super__.apply(this, arguments);

        fire = !Class.isNumber(fire) ? 0 : fire;

        if((fire & 0x04) != 0){
            U.userZ = M.z;
        }

        if((fire & 0x01) != 0){
            this.onZOrderChanged(fire);
        }
    }.$override(this.setZ);

    /**
     * Set outer size of the component.<p>
     * 
     * @param w, width
     * @param h, height
     * @param fire       1: raise <em>resized</em>  event
     *                   2: doLayout
     *                   4: set this size as original size
     */
    thi$.setSize = function(w, h, fire){
        var M = this.def, U = this._local;

        arguments.callee.__super__.apply(this, arguments);

        fire = !Class.isNumber(fire) ? 0 : fire;

        if((fire & 0x04) != 0){
            U.userW = M.width;
            U.userH = M.height;
        }

        if((fire & 0x01) != 0){
            this.onResized(fire);
        }
        
    }.$override(this.setSize);
    

    thi$.setBounds = function(x, y, w, h, fire){
        var M = this.def, U = this._local;

        arguments.callee.__super__.apply(this, arguments);

        fire = Class.isNumber(fire) ? fire : 0;

        if((fire & 0x04) != 0){
            U.userX = M.x;
            U.userY = M.y;

            U.userW = M.width;
            U.userH = M.height;
        }

        if((fire & 0x01) != 0){
            this.onGeomChanged(fire);
        }

    }.$override(this.setBounds);
    
    thi$._adjust = function(cmd, show){
        switch(cmd){
        case "move":
        case "resize":
            var bounds = this.getBounds();
            this.adjustCover(bounds);
            this.adjustResizer(bounds);
            this.adjustShadow(bounds);
            break;
        case "zorder":
            var z = this.getZ();
            this.setCoverZIndex(z);
            this.setResizerZIndex(z);
            this.setShadowZIndex(z);
            break;
        case "display":
            this.setCoverDisplay(show);
            this.setResizerDisplay(show);
            this.setShadowDisplay(show);
            break;
        case "remove":
            this.removeCover();
            this.removeResizer();            
            this.removeShadow();
            break;
        }

    }.$override(this._adjust);
    
    /**
     * Tests whether this component has scroll bar
     * 
     * @return {
     *   hscroll: true/false, 
     *   vscroll: true/false
     * }
     */
    thi$.hasScrollbar = function(){
        return DOM.hasScrollbar(this.view);
    };

    /**
     * Apply a style set to the component.<p>
     * 
     * @param styles, an object with key are style name and value are style value. 
     */
    thi$.applyStyles = function(styles){

        if(arguments.callee.__super__.apply(this, arguments)){
            this.onGeomChanged(0x02);            
        }

    }.$override(this.applyStyles);
    
    thi$.setController = function(ctrl){
        this.controller = ctrl;
        this.controller.setContainer(this);
    };
    
    thi$.delController = function(){
        var ctrl = this.controller;
        if(ctrl){
            ctrl.removeFrom(this.view);
            delete ctrl.container;
            delete this.controller;
        }
        return ctrl;
    };
    
    /**
     * Return whether this component is always on top.
     */
    thi$.isAlwaysOnTop = function(){
        return this.def.alwaysOnTop || false;
    };
    
    /**
     * Set this component to always on top
     * 
     * @param b, boolean value indicate whether is always on top
     */
    thi$.setAlwaysOnTop = function(b){
        b = b || false;
        var ZM = this.container;
        if(ZM) ZM.setCompAlwaysOnTop(this, b);
    };
    
    /**
     * Moves the component up, or forward, one position in the order
     */
    thi$.bringForward = function(){
        var ZM = this.container;
        if(ZM) ZM.bringCompForward(this);
    };
    
    /**
     * Moves the component to the first position in the order
     */
    thi$.bringToFront = function(){
        var ZM = this.container;
        if(ZM) ZM.bringCompToFront(this);        
    };
    
    /**
     * Moves the component down, or back, one position in the order
     */
    thi$.sendBackward = function(){
        var ZM = this.container;
        if(ZM) ZM.sendCompBackward(this);        
    };
    
    /**
     * Moves the component to the last position in the order
     */
    thi$.sendToBack = function(){
        var ZM = this.container;
        if(ZM) ZM.sendCompToBack(this);        
    };

    /**
     * The peer component is the action object of this component. 
     * For example, window and its title, the window is title's 
     * peer component. If there are some buttons in title area,
     * then the window object also are peer component of those 
     * buttons.
     */
    thi$.setPeerComponent = function(peer){
        this.peer = peer;
    };
    
    /**
     * Return peer component of this component.
     * 
     * @see setPeerComponent(peer)
     */
    thi$.getPeerComponent = function(){
        return this.peer;        
    };

    /**
     * Notifies peer component with special message id and 
     * event.
     * 
     * @param msgId, a string identify the event
     * @param event, a js.util.Event object
     */
    thi$.notifyPeer = function(msgId, event, sync){
        var peer = this.getPeerComponent();
        if(peer){
            _notify.call(this, peer, msgId, event, sync);
        }
    };

    /**
     * Sets container of this component
     */
    thi$.setContainer = function(container){
        this.container = container;

        if(container && this.isMovable() && 
           container instanceof js.awt.Container && 
           container.isAutoFit()){
            var moveObj = this.getMoveObject(),
            msgType = moveObj.getMovingMsgType();
            MQ.register(msgType, this, _onMovingEvent);
            moveObj.releaseMoveObject();
            delete this.moveObj;
        }
    };

    /**
     * Gets container of this component
     */
    thi$.getContainer = function(){
        return this.container;
    };

    /**
     * Notifies container component with special message id and 
     * event.
     * 
     * @param msgId, a string identify the event
     * @param event, a js.util.Event object
     */
    thi$.notifyContainer = function(msgId, event, sync){
        var comp = this.getContainer();
        if(comp){
            _notify.call(this, comp, msgId, event, sync);
        }
    };

    var _notify = function(comp, msgId, event, sync){
        sync = (sync == undefined) ? this.def.sync : sync;

        if(sync == true){
            MQ.send(msgId, event, [comp.uuid()]);    
        }else{
            MQ.post(msgId, event, [comp.uuid()]);
        }
    };
    
    /**
     * Sets notify peer (container) is synchronized or not
     * 
     * @param b, true/false
     */
    thi$.setSynchronizedNotify = function(b){
        this.def.sync = b || false;
    };

    /**
     * Returns whether current notify mode is synchronized or not
     * 
     * @return true/false
     */
    thi$.isSynchronizedNotify = function(){
        return this.def.sync || false;
    };
    
    /**
     * When the position and size of the component has changed, we need
     * to adjust its container's size to handle the scroll bars.
     */
    thi$.autoResizeContainer = function(){
        var container = this.getContainer();
        if(container && (container instanceof js.awt.Container)){
            container.autoResize();
        }
    };
    
    /**
     * Handler of the component which is moving in an 
     * auto fit container 
     */
    var _onMovingEvent = function(e){
        this.autoResizeContainer();
    };

    /**
     * Activate this component
     * 
     */    
    thi$.activateComponent = function(){
        var container = this.container;
        if(container){
            container.activateComponent(this);
        }
    };
    
    /**
     * Open a dialog with specified dialog class and dialog object
     * 
     * @param className, the definition of dialog
     * @param rect, x, y, width and height
     * @param dialogObj, the DialogObj instance 
     * @param handler
     */
    thi$.openDialog = function(className, rect, dialogObj, handler){
        var dialog = J$VM.Factory.createComponent(
            className, rect, this.Runtime());

        dialog.setPeerComponent(this);
        dialog.setDialogObject(dialogObj, handler);

        dialog.show();
        return dialog;
    };
    
    /**
     * Open confirm dialog
     * 
     * @param className, the definition of dialog
     * @param rect, x, y, width and height
     * @param def, ,an object like:{
     *     className: "",
     *     model: {
     *         msgSubject: "",
     *         msgContent: ""
     *     }
     * } 
     * @param handler
     */
    thi$.openConfirm = function(className, rect, def, handler){
        def = def || {};
        def.className = def.className || "msgbox";
        def.stateless = true;
        def.model = def.model || {};
        def.model.msgType = def.model.msgType || "confirm";
        return this.openDialog(
            className,
            rect, 
            new js.awt.MessageBox(def, this.Runtime()),
            handler);
    };

    /**
     * When this component was add to DOM tree, then invokes
     * this method. 
     * 
     * @return Must return true if did repaint.
     * 
     * Notes: Sub class should override this method
     */
    thi$.repaint = function(){
        if(arguments.callee.__super__.apply(this, arguments)){
            var M = this.def;

            // Create mover for moving if need
            if(M.movable === true && !this.movableSettled()){
                this.setMovable(true);
            }
            
            // Create resizer for resizing if need
            if(M.resizable === true && !this.resizableSettled()){
                this.setResizable(true, M.resizer);
            }
            
            // For shadow
            if(M.shadow === true && !this.shadowSettled()){
                this.setShadowy(true);
            }
            
            // For floating layer
            if(M.isfloating === true && !this.floatingSettled()){
                this.setFloating(true);    
            }

            if(this.resizableSettled()){
                this.addResizer();
                this.adjustResizer();
            }
            
            if(this.shadowSettled()){
                this.addShadow();
                this.adjustShadow();
            }
            
            this.showDisableCover(!this.isEnabled());

            return true;
        }

        return false;

    }.$override(this.repaint);
    
    /**
     * @see js.awt.BaseComponent
     */
    thi$.doLayout = function(force){
        if(arguments.callee.__super__.apply(this, arguments)){
            var ctrl = this.controller;
            if(ctrl){
                ctrl.appendTo(this.view); // Keep controller alwasy on top
                var bounds = this.getBounds(), cbounds = ctrl.getBounds(),
                x, y, w, h;
                w = ctrl.isRigidWidth() ? cbounds.width : bounds.innerWidth;
                h = ctrl.isRigidHeight()? cbounds.height: bounds.innerHeight;
                x = bounds.MBP.paddingLeft + (bounds.innerWidth - w)*ctrl.getAlignmentX();
                y = bounds.MBP.paddingTop  + (bounds.innerHeight- h)*ctrl.getAlignmentY();

                ctrl.setBounds(x, y, w, h, 7);
            }
            return true;
        }

        return false;

    }.$override(this.doLayout);
    
    /**
     * When this component was moved to a new position will 
     * invoke this method,
     * 
     * 
     * Notes: Sub class maybe should override this method
     */
    thi$.onMoved = function(fire){
        
    };

    /**
     * When this component was resized will invoke this method.
     * 
     * @param doLayout, true then invoke doLayout of this component
     * 
     * Notes: Sub class maybe should override this method
     */
    thi$.onResized = function(fire){
        if((fire & 0x02) != 0){
            this.doLayout(true);
        }
        
        // Adjust the container's size to handle the scrollbars
        this.autoResizeContainer();
    };

    /**
     * When this component ZOrder.
     * 
     * Notes: Sub class maybe should override this method
     */
    thi$.onZOrderChanged = function(fire){

    };
    
    /**
     * When geometric (includes position and size) was changed 
     * of this compoent will invoke this method.
     * 
     * Notes: Sub class maybe should override this method
     */
    thi$.onGeomChanged = function(fire){
        if((fire & 0x02) != 0){
            this.doLayout(true);
        }
    };

    thi$.onStateChanged = function(e){
        if(!this.isStateless()){
            var buf = this.__buf__.clear();
            buf.append(this.def.className).append("_")
                .append(this.getState());
            this.view.className = buf.toString();
        }        
        
        if(this.view.parentNode){
            this.showDisableCover(!this.isEnabled());
        }
    };

    /**
     * Override destroy method of js.lang.Object
     */
    thi$.destroy = function(){
        this.setShadowy(false);
        this.setResizable(false);
        this.setMovable(false);

        if(this.controller){
            this.controller.destroy();
            delete this.controller;
        }

        var container = this.container;
        if(container && container instanceof js.awt.Container){
            container.removeComponent(this);
        }

        delete this.container;        
        delete this.peer;

        arguments.callee.__super__.apply(this, arguments);

    }.$override(this.destroy);
	
    thi$.getLastResizer = function(){
        var resizer = this._local.resizer, 
        len = resizer ? resizer.length : 0,
        el;
		
        for(var i = 0; i < len; i++){
            el = resizer[i];
            if(el){
                return el;
            }
        }
		
        return undefined;
    };

    thi$._init = function(def, Runtime, view){
        if(def == undefined) return;

        def.classType = def.classType || "js.awt.Component";
        
        arguments.callee.__super__.apply(this, arguments);
        view = this.view;

        var buf = this.__buf__ = new js.lang.StringBuffer();
        
        if(!this.isStateless()){
            def.state = def.state || 0;
            view.className = buf.append(def.className).append("_")
                .append(this.getState()).toString();
        }

        view.id = def.classType + "." + ccount++;

        if(def.prefSize){
            this.isPreferredSizeSet = true;
        }
        if(def.miniSize){
            this.isMinimumSizeSet = true;
        }
        if(def.maxiSize){
            this.isMaximumSizeSet = true;
        }
        
        // Set Tip
        var tip = def.tip;
        if(Class.isString(tip) && tip.length > 0) {
            this.setToolTipText(tip);
        }
        
    }.$override(this._init);

    this._init.apply(this, arguments);
    
}.$extend(js.awt.BaseComponent).$implements(
    js.awt.State, js.util.Observer, js.awt.Shadow, 
    js.awt.Movable, js.awt.MoveObject, 
    js.awt.Resizable, js.awt.SizeObject, 
    js.awt.Editable, js.awt.PopupLayer);

