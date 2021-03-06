/**
 * @File List.js
 * @Create 2011-06-01
 * @author xiaoqing.qiu@china.jinfonet.com
 */
$package("js.awt");
/**
 * @param def an object container a set of definitions of a set of buttons,
 * please see the definition of Button class for more details.
 * 
 * for example
 * 
 * 
 */
js.awt.List = function(def) {		
	var _items = js.util.LinkedList.newInstance([]);
	
	var _selectedItems = js.util.LinkedList.newInstance([]);

	var _init = function(def) {
		js.awt.Container.call(this, def);
		
		this.container = def.container;
		this.multiSelect = def.canMultiSelect || false;
		if(def.items && def.items.length >0){
			for ( var i = 0, len = def.items.length; i < len; i++) {
				var _itemDef = def.items[i];
				_itemDef.className = def.className;
				_itemDef.container = this;
				this.addItem(_itemDef);
			}
		}
		J$VM.MQ.register("js.awt.event.ListItemEvent", this, this.doAction);
	};
	
	this.onStateChange = function(){
		if (this.container) {
			if(this.isEnabled()){
				this.showCover(false);
			}else{
				this.showCover(true);
			}
		}
	};
	
	this.contain = function(itemDef){
		for(var i=0, len=_items.length; i<len; i++){
			if(_items[i].getValue() === itemDef.value){
				return true;
			}
		}
		return false;
	};

	this.getSelectedItems = function() {
		return _selectedItems;
	};
	
	this.getSelectedIndeies = function(){
		var indeies=[];
		for(var i=0; i < _selectedItems.length;i++){
			indeies.push(items.indexOf(_selectedItems[i]));
		}
		return indeies;
	};
	
	this.setSelectedItemsByValue = function(values){
		this.unSelectAll();
		if (!this.multiSelect) {
			for(var i=0; i < _items.length; i++){
				if(_items[i].getValue() == values[0]){
					_selectItem.$bind(this)(i);
					return;
				}
			}
		}else{
			for(var i=0; i < values.length; i++){
				for(var j=0; j < _items.length; j++){
					if(_items[j].getValue() == values[i]){
						_selectItem.$bind(this)(j);
						break;
					}
				}
			}
		}
	};
	
	this.setSelectedIndeies = function(indeies){
		this.unSelectAll();
		if (!this.multiSelect) {
			if(_items[indeies[0]]){
				_selectItem.$bind(this)(indeies[0]);
			}
		}else{
			for(var i=0;i<indeies.length;i++){
				if(_items[indeies[i]]){
					_selectItem.$bind(this)(indeies[i]);
				}
			}
		}
	};
	
	this.setSelectedItems = function(items){
		this.unSelectAll();
		if (!this.multiSelect) {
			if(_items.contains(items[0])){
				_selectItem.$bind(this)(_items.indexOf(items[0]));
			}
		}else{
			for(var i=0; i < items.length; i++){
				if(_items.contains(items[i])){
					_selectItem.$bind(this)(_items.indexOf(items[i]));
				}
			}
		}
		
	};
	
	this.unSelectAll = function(){
		for(var i=0, len=_selectedItems.length;i<len;i++){
			this.unSelectRender(_selectedItems[i]);
		}
		_selectedItems.clear();
	};
	
	this.setItems = function(defs){
		_items.clear();
		_selectedItems.clear();
		this.clear();
		if (typeof defs == "object"){
			for(var i=0, len=defs.length; i<len; i++){
				this.addItem(defs[i]);
			}
		}
	};
	
	this.getAll = function() {
		return _items;
	};
	
	// this.getItemMap = function() {
		// return _selectedItems;
	// };
	
	this.addItem = function(def) {
		if(this.distinct && this.contain(def)){
			return;
		}
		var item = new js.awt.ListItem(def);
		_items.addLast(item);
		this.addComponent(item);
		if(typeof this.onItemsChanged == "function") {
			this.onItemsChanged();
		}
	};

	this.remove = function(item) {
		if (typeof item == "object"){
			if(_selectedItems.contains(item)){
				_selectedItems.remove(item);
			}
			_items.remove(item);
			this.removeComponent(item);
			if(typeof this.onItemsChanged == "function") {
				this.onItemsChanged();
			}
		}
	};
	
	// Add by mingfa.pan, 2011-05-25
	this.removeAll = function() {
		_items.clear();
		_selectedItems.clear();
		this.clear();
		if(typeof this.onItemsChanged == "function") {
			this.onItemsChanged();
		}
	};
	
	this.isAllSelected = function() {
		return this.multiSelect && _items.length == _selectedItems.length;
	};
	
	var _selectItem =function(index){
		if(_items[index] && !_selectedItems.contains(_items[index])){
			_selectedItems.addLast(_items[index]);
			this.selectedRender(_items[index]);
		}
	};
	
	var _unselectItem = function(index){
		if(_items[index] && _selectedItems.contains(_items[index])){
			_selectedItems.remove(_items[index]);
			this.unSelectRender(_items[index]);
		}
	};
	
	var _select = function (event) {
		curSelect = event.getItem();
		if(!curSelect) {
			return;
		}
		
		if(this.multiSelect && event.ctrlKey){
			if(_selectedItems.contains(curSelect)){
				_unselectItem.$bind(this)(_items.indexOf(curSelect));
			}else{
				_selectItem.$bind(this)(_items.indexOf(curSelect));
			}
		}else if(this.multiSelect && event.shiftKey){
			if(_selectedItems.length == 0){
				_selectItem.$bind(this)(_items.indexOf(curSelect));
			}else{
				var from = _items.indexOf(_selectedItems.getLast());
				var to = _items.indexOf(curSelect);
				var step = (to-from)/Math.abs(to-from);
				for(var i=1; i <= Math.abs(to-from); i++){
					_selectItem.$bind(this)(from+i*step);
				}
			}
		}else{
			this.unSelectAll();
			_selectItem.$bind(this)(_items.indexOf(curSelect));
		}
		
		if (typeof this.container == "object") {
			J$VM.MQ.post("js.awt.event.ListViewEvent",
				new js.awt.event.ListViewEvent("click", this), [ this.container.uuid() ]);
		}
		
		if(typeof this.onSelectChanged == "function") {
			this.onSelectChanged();
		}
		
		this.onafterselect(this);
	};
	
	this.doAction = function(event) {
		_select.$bind(this)(event);
	};
	
	this.selectedRender = function (listItem) {
		listItem.setChecked(true);
		var styleName = this.__buf__.clear().append(this.styleClass).append("_label_selected");
		listItem.view.className = styleName;
	};
	
	// Add by mingfa.pan, 2011-05-20
	this.unSelectRender = function (listItem) {
		listItem.setChecked(false);
		var styleName = this.__buf__.clear().append(this.styleClass).append("_label_").append(this.state);
		listItem.view.className = styleName;
	};
	
	/**
	 * Overwrite this method to meet your special requirement
	 */
	this.onafterselect = function(obj) {
		//TODO do your work here
	};

	this.updateUI = function() {
		this.clear();
		for ( var i = 0, len = _items.length; i < len; i++) {
			this.addComponent(_items.get(i));
		}
	};
	
	this.onclick = function(e) {
		e.cancelBubble();
	};

	if (typeof def == "object") {
		this.def = def;
		this.distinct = def.distinct || false;
		
		_init.$bind(this)(def);
	}
}.$extend(js.awt.Container);
