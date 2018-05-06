<template>

	    <div ref="wrap" class="vue-table-wrap" v-bind:style="wrapperStyle">

	      <table class="vue-table">
	        <thead v-if="title" >
	          <td class="title"
	              :colspan="headers.length + (selectable && 1)">{{ title }}</td>
	        </thead>
	        <thead class="headers">
	          <td v-if="selectable" class="select">
	            <div v-on:click="toggleAllRows" v-html="globalSelectIcon()"></div>
	          </td>
	          <td v-for="header in headers" key="header.name" :align="header.align">

	            <div 
	                 @click="header.sortable && sortBy(header)" 
	                 v-bind:class="header.sortable ? 'sortable' : ''"
	                 style="vertical-align:sub;">
	              <span v-if="header.align=='center'" class="arrow"
	              ></span><span v-bind:style="headerStyle(header)"
	              >{{ header.name }}</span><span 
	                class="arrow" 
	                :style="headerArrowStyle(header)" 
	              	v-html="lastSortedHeader == header ? (lastSortedOrder == 'asc' ? arrowAsc : arrowDesc) : ' '"></span>
	            </div>
	          </td>
	        </thead>

	        <tbody>
	          <tr v-if="!rows.length"> 
	            <td class="no-items" align="center" :colspan="headers.length + (selectable && 1)">{{ messageNoItems }}</td>
	          </tr>  

	          <tr 
	              v-for="(row, index) in rows" 
	              key="index" 
	              _class="content-row" 
	              v-bind:class="rowClass(row)" 
	              @click="selectRow && toggleRow(row)">  <!-- selectRow && toggleRow(row) -->
	            <td v-if="selectable" class="select">
	              <div v-on:click="toggleRow(row, $event)" v-html="row.selected ? selectedHtml : notSelectedHtml"></div>
	            </td>
	            <td 
	                v-for="header in headers" 
	                :align="header.align" 
	                :class="header.className" 
	                :style="cellStyle(header, row, index)">
	              {{ formattedCell(header, row, index) }}
	            </td>
	          </tr>
	        </tbody>
	      </table>

	    </div>

</template>

<script>

export default {

	props: {
		'title': {
			type: String,
			required: false
		},
		'headers': {
			type: Array,
			required: true
		},
		'items': {
			type: Array,
			required: true
		},
		'item-key': {
			type: String,
			required: false,
			default: 'id'
		},
		'selectable': {
			type: Boolean,
			required: false,
			default: false
		},
		'selectRow': {
			type: Boolean,
			required: false,
			default: false
		},
		'no-data-text': {
			type: String,
			required: false,
			default: 'No items'
		},
		'height': {
			type: [Number, String],
			required: false
		},
		'max-height': {
			type: [Number, String],
			required: false
		},
		'value': {
			type: Array,
			required: false
		}
	},

	data: function () {

		return {
			rows: [],
		    lastSortedHeader: null,
		    lastSortedOrder: null,
		    selectedHtml: '<i class="material-icons selected">check_box</i>', // '☒',
		    notSelectedHtml: '<i class="material-icons">check_box_outline_blank</i>',  //'☐',
		    indeterminateSelectionHtml: '<i class="material-icons undeterminated">indeterminate_check_box</i>',  //'☐',
		    arrowAsc: '<i class="material-icons arrow-icon">arrow_upward</i>',  // '⇡'
		    arrowDesc: '<i class="material-icons arrow-icon">arrow_downward</i>',  // '⇣'
			messageNoItems: this['noDataText'] || 'No items found'
		}

	},

	mounted: function () {
		this.$refs.wrap.addEventListener('scroll', function () {
  	         let translate = "translate(0,"+this.scrollTop+"px)";
 	         let heads = this.querySelectorAll('thead')
	         heads.forEach(thead => thead.style.transform = translate)
	    })
	},

	computed: {

		wrapperStyle: function () {
			if (this.height)
				return `height:${this.height}px;`
			if (this.maxHeight)
				return `max-height:${this.maxHeight}px;`
			return ''
		}

	},

	watch: {

		headers: function () {
			this.resetSort()
		},

		items: function () {
			this.rows = this.items.map(item => {
				return {...item}
			})
			this.resetSort()
		},

	},

	methods: {

	    formattedCell: function (header, row, index) {
	      let value
	      if (!header.value)
	        return ''
	      if (typeof header.value == 'function')
	        value = header.value(row, index)
	      else 
	        value = row[header.value] || ''
	      if (header.format)
	        return header.format(value, index)
	      return value
	    },

	    rowClass: function (row) {
	      if (this.selectRow)
	        if (row.selected)
	          return 'selected-row'
	        else
	          return 'hover-row'
	      return ''
	    },
	    
	    cellStyle: function (header, row, index) {
	      if (header.style)
	        return header.style(row[header.prop], index)
	      return ''
	    },
	    
	    headerArrowStyle: function (header) {
	      return ''
	    },

	    headerStyle: function (header) {
	      let align=header.align || 'left'
	      let style = 'display:inline-block;float:' + align
	      return style
	    },
	    
	    toggleRow: function (row, event) {
	      let newSelected = !row.selected
	      this.$set(row, 'selected', newSelected)
	      if (event) {
	      	event.stopPropagation()
	      }  	
	      this.emitInputMessage()
	      return false
	    },
	    
	    toggleAllRows: function () {
	      let selected = true
	      if (this.isAllSelected()) {
	        selected = false
	      }  
	      this.rows.forEach(row => this.$set(row, 'selected', selected))
	      this.emitInputMessage()
	    },
	    
	    isAllSelected: function () {
	      let hasUnselected = this.rows.find(row => !row.selected)
	      return !hasUnselected
	    },
	    
	    globalSelectIcon: function () {
	    	if (!this.rows)
	    		return this.notSelectedHtml
	        let hasSelected = this.rows.find(row => row.selected)
	        let hasUnselected = this.rows.find(row => !row.selected)
	        if (hasSelected) {
	            if (hasUnselected)
	                return this.indeterminateSelectionHtml
	            return this.selectedHtml
	        }
	        return this.notSelectedHtml
	    },

	    emitInputMessage () {
	    	let itemKey = this.itemKey || 'id'
	    	let selectedRowsId = this.rows.filter(row => row.selected).map(row => row.id)
	    	let selectedItems = selectedRowsId.map(id => this.items.find(item => item[itemKey] == id))
	    	this.$emit('input', selectedItems)
	    },

	    sortBy: function (header) {
	      let value = header.value
	      let order = 'asc'
	      if (header == this.lastSortedHeader && this.lastSortedOrder == 'asc') 
	        order = 'desc'
	      let greaterThan = (order == 'asc' ? 1 : -1)
	      let smallerThan = -greaterThan
	      let sortFunction

	      if (typeof value == 'undefined')
	        return
	      if (typeof value == 'function') {
	          sortFunction = function (a, b) {
	            let aVal = value(a)
	            let bVal = value(b)
	            if (aVal > bVal) return greaterThan
	            if (aVal < bVal) return smallerThan
	            return 0
	          }
	      }    
	      else {
	        sortFunction = function (a, b) {
	          if (a[value] > b[value]) return greaterThan
	          if (a[value] < b[value]) return smallerThan
	          return 0
	        }
	      }    
	      this.lastSortedHeader = header
	      this.lastSortedOrder = order
	      this.rows = this.rows.sort(sortFunction)
	    },

	    resetSort: function () {
			this.lastSortedHeader = null
	        this.lastSortedOrder = null
	    }

	}

}
 
</script>

<style>

.vue-table-wrap {
    overflow-y: scroll;
    width: 100%;
    height:100%;
}

.vue-table {
  width:100%;
  border-collapse: collapse;
}

.vue-table .title {
  background-color:#fff;
  padding:8px;
  padding-left:12px;
  font-size:18px;
}

.vue-table thead {
  background-color: white;
}

.vue-table thead.headers td {
	font-size:12px;
  box-shadow: 0px 1px 0px 0px #ccc;
}

.vue-table thead td.select {
  font-weight: 200;
  cursor: pointer;
  text-align:left;
}

.vue-table thead td {
  padding: 4px;
  font-weight: 700;
  color: #444;
  -webkit-user-select: none;  /* Chrome all / Safari all */
  -moz-user-select: none;     /* Firefox all */
  -ms-user-select: none;      /* IE 10+ */
  user-select: none;          /* Likely future */      
}

.vue-table .arrow {
  display:inline-block;
  width:1.5em;
  //background-color: yellow;
  text-align: center;
}

.vue-table .arrow-icon {
  font-size:16px;
  font-weight:700;
  color: #42A5F5 !important;
}

.vue-table .sortable {
  cursor: pointer;
}

.vue-table .sortable:hover {
    color: #000;
}

.vue-table tbody tr td {
  border-bottom: 1px solid #bbb;
  padding: 6px;
}

.vue-table thead td {
	padding: 6px;
}

.vue-table tr td.select {
  /* padding-left:12px; */
  /*padding-right: 8px; */
  cursor: pointer;
}

.vue-table tbody tr.selected-row {
  background-color: #eee;
  cursor:pointer;
}

.vue-table tbody tr.hover-row:hover, .vue-table tbody tr.selected-row:hover {
  background-color: #d8d8d8;
  cursor:pointer;
}

.vue-table .no-items {
  padding: 32px;
  font-weight:500;
  color:#333;
}

.vue-table .material-icons {
  vertical-align: sub;
  color: rgba(0,0,0,.54);
  
  transition: .3s cubic-bezier(.4,0,.6,1);
}


.vue-table .selected {
    color: #42A5F5 !important; }

.vue-table .undeterminated {
    color: #90CAF9 !important;  
}


</style>
