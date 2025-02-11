var _=Object.defineProperty;var ie=Object.getOwnPropertyDescriptor;var re=Object.getOwnPropertyNames;var se=Object.prototype.hasOwnProperty;var oe=(t,e)=>{for(var i in e)_(t,i,{get:e[i],enumerable:!0})},ae=(t,e,i,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(const r of re(e))!se.call(t,r)&&r!==i&&_(t,r,{get:()=>e[r],enumerable:!(s=ie(e,r))||s.enumerable});return t};var le=t=>ae(_({},"__esModule",{value:!0}),t);var fe={};oe(fe,{default:()=>me});module.exports=le(fe);var b=require("@babel/types");function $(t,e){const i=Object.keys(e.reactNativeImports),s=Object.values(e.reactNativeImports),r=Object.entries(e.reactNativeImports),o=[];t.node.body.forEach(a=>{(0,b.isImportDeclaration)(a)&&a.source.value==="react-native"&&(a.specifiers=a.specifiers.filter(c=>!i.some(f=>f===c.local.name)),a.specifiers.length===0&&o.push(a))}),s.forEach(a=>{const c=t.node.body.find(f=>(0,b.isImportDeclaration)(f)&&f.source.value===`react-native-web/dist/exports/${a}`);c&&(c.specifiers=[])}),r.forEach(([a,c])=>{const f=(0,b.importDeclaration)([(0,b.importSpecifier)((0,b.identifier)(a),(0,b.identifier)(c))],(0,b.stringLiteral)(e.opts.isLocal?e.file.opts.filename?.split("react-native-unistyles").at(0)?.concat(`react-native-unistyles/components/native/${c}`)??"":`react-native-unistyles/components/native/${c}`));t.node.body.unshift(f)}),o.forEach(a=>t.node.body.splice(t.node.body.indexOf(a),1))}function I(t){return t.file.opts.filename?.includes("node_modules")}var D=require("@babel/types");function K(t){return t.node.openingElement.attributes.find(e=>(0,D.isJSXAttribute)(e)&&(0,D.isJSXIdentifier)(e.name,{name:"ref"})&&(0,D.isStringLiteral)(e.value))}var n=require("@babel/types"),g={Theme:0,ThemeName:1,AdaptiveThemes:2,Breakpoints:3,Variants:4,ColorScheme:5,Dimensions:6,Orientation:7,ContentSizeCategory:8,Insets:9,PixelRatio:10,FontScale:11,StatusBar:12,NavigationBar:13,Ime:14};function V(t){if(t){if((0,n.isIdentifier)(t))return{properties:[t.name]};if((0,n.isObjectPattern)(t))return{properties:t.properties.flatMap(s=>V(s)).flatMap(s=>s?.properties).filter(s=>s!==void 0)};if((0,n.isObjectProperty)(t)&&(0,n.isIdentifier)(t.value))return{properties:[t.key.name]};if((0,n.isObjectProperty)(t)&&(0,n.isObjectPattern)(t.value)){const e=t.value.properties.flatMap(s=>V(s));return{parent:t.key.name,properties:e.flatMap(s=>s?.properties).filter(s=>s!==void 0)}}}}function w(t){switch(t){case"theme":return g.Theme;case"themeName":return g.ThemeName;case"adaptiveThemes":return g.AdaptiveThemes;case"breakpoint":return g.Breakpoints;case"colorScheme":return g.ColorScheme;case"screen":return g.Dimensions;case"isPortrait":case"isLandscape":return g.Orientation;case"contentSizeCategory":return g.ContentSizeCategory;case"ime":return g.Ime;case"insets":return g.Insets;case"pixelRatio":return g.PixelRatio;case"fontScale":return g.FontScale;case"statusBar":return g.StatusBar;case"navigationBar":return g.NavigationBar;case"variants":return g.Variants;default:return null}}function C(t,e=[]){return(0,n.isReturnStatement)(t)&&e.push(t),(0,n.isBlockStatement)(t)&&t.body.forEach(i=>C(i,e)),(0,n.isIfStatement)(t)&&(C(t.consequent,e),t.alternate&&C(t.alternate,e)),e}function ce(t){let e=0;for(let s=0;s<t.length;s++)e=(e<<5)-e+t.charCodeAt(s),e|=0;return Math.abs(e)%1e9}function X(t,e){const{callee:i}=t.node;return(0,n.isMemberExpression)(i)&&(0,n.isIdentifier)(i.property)?i.property.name==="create"&&(0,n.isIdentifier)(i.object)&&i.object.name===e.file.styleSheetLocalName:!1}function q(t,e){if(!e.file.forceProcessing&&!e.file.hasUnistylesImport)return!1;const{callee:i}=t.node;return(0,n.isMemberExpression)(i)&&(0,n.isIdentifier)(i.property)&&i.property.name==="create"&&(0,n.isIdentifier)(i.object)}function J(t,e){const i=e.filename?.replace(e.cwd,"")??"",s=ce(i)+ ++e.file.tagNumber;t.node.arguments.push((0,n.numericLiteral)(s))}function z(t){const e=new Set,i=t.node.arguments[0];return(0,n.isObjectExpression)(i)&&i?.properties.forEach(r=>{!(0,n.isObjectProperty)(r)||!(0,n.isIdentifier)(r.key)||((0,n.isObjectProperty)(r)&&(0,n.isObjectExpression)(r.value)&&r.value.properties.forEach(o=>{(0,n.isObjectProperty)(o)&&(0,n.isIdentifier)(o.key)&&(0,n.isIdentifier)(r.key)&&o.key.name==="variants"&&e.add({label:"variants",key:r.key.name})}),(0,n.isArrowFunctionExpression)(r.value)&&(0,n.isObjectExpression)(r.value.body)&&r.value.body.properties.forEach(o=>{(0,n.isObjectProperty)(o)&&(0,n.isIdentifier)(o.key)&&(0,n.isIdentifier)(r.key)&&o.key.name==="variants"&&e.add({label:"variants",key:r.key.name})}))}),Array.from(e).reduce((r,{key:o,label:a})=>r[o]?(r[o]=[...r[o],a],r):(r[o]=[a],r),{})}function Y(t){const e=t.get("arguments.0");if(!e||Array.isArray(e)||!(0,n.isFunctionExpression)(e.node)&&!(0,n.isArrowFunctionExpression)(e.node))return;const i=e.node.params,[s,r]=i,o=[];if((0,n.isObjectPattern)(s))for(const u of s.properties){const p=V(u);p&&o.push(p)}(0,n.isIdentifier)(s)&&o.push({properties:[s.name]});const a=[];if((0,n.isObjectPattern)(r))for(const u of r.properties){const p=V(u);p&&a.push(p)}(0,n.isIdentifier)(r)&&a.push({properties:[r.name]});let c=null;if((0,n.isObjectExpression)(e.node.body)?c=e.get("body"):e.traverse({ReturnStatement(u){if(!c&&u.get("argument").isObjectExpression()){const p=u.get("argument");p.isObjectExpression()&&(c=p)}}}),!c)return;const f=new Set;c.get("properties").forEach(u=>{const p=u.get("key");if(Array.isArray(p)||!p.isIdentifier())return;const P=p.node.name,S=u.get("value");Array.isArray(S)||(S.isObjectExpression()&&S.get("properties").some(y=>{const E=y.get("key");if(!Array.isArray(E))return E.isIdentifier()&&E.node.name==="variants"})&&f.add({label:"variants",key:P}),S.isArrowFunctionExpression()&&(0,n.isObjectExpression)(S.node.body)&&S.node.body.properties.some(y=>(0,n.isObjectProperty)(y)&&(0,n.isIdentifier)(y.key)&&y.key.name==="variants")&&f.add({label:"variants",key:P}))});const x=new Set;o.forEach(({properties:u})=>{u.forEach(p=>{const P=e.scope.getBinding(p);P&&P.referencePaths.forEach(S=>{const O=S.findParent(j=>j.isObjectProperty()&&j.parentPath===c);if(!O)return;const y=O.get("key");if(Array.isArray(y))return;const E=y.isLiteral()&&(y.isStringLiteral()||y.isNumericLiteral()||y.isBooleanLiteral())?String(y.node.value):null,k=y.isIdentifier()?y.node.name:E;k&&x.add({label:"theme",key:k})})})});const A=new Set,U=(0,n.isIdentifier)(r)?r.name:void 0;a.forEach(({properties:u,parent:p})=>{u.forEach(P=>{const S=e.scope.getBinding(P);if(!S)return;let O=!!w(P),y=P;if(!O&&(!U||U&&U!==P)){if(!p||!w(p))return;y=p}S.referencePaths.forEach(E=>{let k=y;if(E.parentPath?.isMemberExpression()&&E.parentPath.get("object")===E){const T=E.parentPath,W=T.get("property");if(W.isIdentifier()&&(U&&(k=W.node.name),k==="insets"&&T.parentPath.isMemberExpression()&&T.parentPath.get("object")===T)){const H=T.parentPath.get("property");H.isIdentifier()&&H.node.name==="ime"&&(k="ime")}}const j=E.findParent(T=>T.isObjectProperty()&&T.parentPath===c);if(!j)return;const N=j.get("key");if(Array.isArray(N))return;const ne=N.isLiteral()&&(N.isStringLiteral()||N.isNumericLiteral()||N.isBooleanLiteral())?String(N.node.value):null,F=N.isIdentifier()?N.node.name:ne;F&&A.add({label:k,key:F})})})});const L=Array.from(f),h=Array.from(x),R=Array.from(A);return h.concat(R).concat(L).reduce((u,{key:p,label:P})=>u[p]?(u[p]=[...u[p],P],u):(u[p]=[P],u),{})}function B(t,e,i,s){const r=a=>{if(t.opts.debug){const c=a.map(f=>Object.keys(g).find(v=>g[v]===f)).join(", ");console.log(`${t.filename?.replace(`${t.file.opts.root}/`,"")}: styles.${e}: [${c}]`)}},o=s.map(w);if(o.length>0){const a=Array.from(new Set(o));r(a);let c=[];((0,n.isArrowFunctionExpression)(i.value)||(0,n.isFunctionExpression)(i.value))&&((0,n.isObjectExpression)(i.value.body)&&c.push(i.value.body),(0,n.isBlockStatement)(i.value.body)&&(c=C(i.value.body).map(f=>((0,n.isIdentifier)(f.argument)&&(f.argument=(0,n.objectExpression)([(0,n.spreadElement)(f.argument)])),f.argument)).filter(f=>(0,n.isObjectExpression)(f)))),(0,n.isObjectExpression)(i.value)&&c.push(i.value),(0,n.isMemberExpression)(i.value)&&(i.value=(0,n.objectExpression)([(0,n.spreadElement)(i.value)]),c.push(i.value)),c.length>0&&c.forEach(f=>{f.properties.push((0,n.objectProperty)((0,n.identifier)("uni__dependencies"),(0,n.arrayExpression)(a.filter(v=>v!==void 0).map(v=>(0,n.numericLiteral)(v)))))})}}var l=require("@babel/types");function G(t,e){const i=t.node.body.filter(h=>(0,l.isExpressionStatement)(h)&&(0,l.isCallExpression)(h.expression)&&(0,l.isMemberExpression)(h.expression.callee));if(i.length===0)return;const s=i.find(h=>{if(!(0,l.isExpressionStatement)(h)||!(0,l.isCallExpression)(h.expression)||!(0,l.isMemberExpression)(h.expression.callee)||!(0,l.isIdentifier)(h.expression.callee.object))return!1;const R=h.expression.callee.object.name;return(0,l.isIdentifier)(h.expression.callee.object,{name:R})&&(0,l.isIdentifier)(h.expression.callee.property,{name:"useVariants"})&&h.expression.arguments.length===1});if(!s)return;const r=s.expression;if(!(0,l.isCallExpression)(r))return;const o=r.callee;if(!(0,l.isMemberExpression)(o)||!(0,l.isIdentifier)(o.object))return;const a=o.object.name,c=t.scope.generateUidIdentifier(a),f=(0,l.variableDeclaration)("const",[(0,l.variableDeclarator)(c,(0,l.identifier)(a))]),v=(0,l.callExpression)((0,l.memberExpression)((0,l.identifier)(c.name),(0,l.identifier)("useVariants")),r.arguments),x=(0,l.variableDeclaration)("const",[(0,l.variableDeclarator)((0,l.identifier)(a),v)]),A=t.node.body.findIndex(h=>h===s),U=t.node.body.slice(A+1),L=(0,l.blockStatement)([x,...U]);t.node.body=[...t.node.body.slice(0,A),f,L],e.file.hasVariants=!0}var Q=["ActivityIndicator","View","Text","Image","ImageBackground","KeyboardAvoidingView","Pressable","ScrollView","FlatList","SectionList","Switch","TextInput","RefreshControl","TouchableHighlight","TouchableOpacity","VirtualizedList","Animated"],Z=["react-native-reanimated/src/component","react-native-gesture-handler/src/components"],ee=[],te={imports:[{name:"NativeText",isDefault:!1,path:"react-native/Libraries/Text/TextNativeComponent",mapTo:"NativeText"},{isDefault:!0,path:"react-native/Libraries/Components/View/ViewNativeComponent",mapTo:"NativeView"}]};var d=require("@babel/types");function M(t,e,i){const s=t.node.specifiers,r=t.node.source;t.node.importKind==="value"&&s.forEach(o=>{for(const a of i.imports){const c=!a.isDefault&&(0,d.isImportSpecifier)(o)||a.isDefault&&(0,d.isImportDefaultSpecifier)(o),f=a.isDefault||!a.isDefault&&a.name===o.local.name,v=a.path===r.value;if(!(!c||!f||!v)){if((0,d.isImportDefaultSpecifier)(o)){const x=(0,d.importDeclaration)([(0,d.importDefaultSpecifier)((0,d.identifier)(o.local.name))],(0,d.stringLiteral)(e.opts.isLocal?e.file.opts.filename?.split("react-native-unistyles").at(0)?.concat(`react-native-unistyles/components/native/${a.mapTo}`)??"":`react-native-unistyles/components/native/${a.mapTo}`));t.replaceWith(x)}else{const x=(0,d.importDeclaration)([(0,d.importSpecifier)((0,d.identifier)(a.mapTo),(0,d.identifier)(a.mapTo))],(0,d.stringLiteral)(e.opts.isLocal?e.file.opts.filename?.split("react-native-unistyles").at(0)?.concat(`react-native-unistyles/components/native/${a.mapTo}`)??"":`react-native-unistyles/components/native/${a.mapTo}`));t.node.specifiers=s.filter(A=>A!==o),t.node.specifiers.length===0?t.replaceWith(x):t.insertBefore(x)}return}}})}var m=require("@babel/types");function me(){return{name:"babel-react-native-unistyles",visitor:{Program:{enter(t,e){e.file.replaceWithUnistyles=Z.concat(e.opts.autoProcessPaths??[]).some(i=>e.filename?.includes(i)),e.file.hasAnyUnistyle=!1,e.file.hasUnistylesImport=!1,e.file.hasVariants=!1,e.file.styleSheetLocalName="",e.file.tagNumber=0,e.reactNativeImports={},e.file.forceProcessing=e.opts.autoProcessRoot&&e.filename?e.filename.includes(`${e.file.opts.root}/${e.opts.autoProcessRoot}/`):!1},exit(t,e){I(e)&&!e.file.replaceWithUnistyles||(e.file.hasAnyUnistyle||e.file.hasVariants||e.file.replaceWithUnistyles||e.file.forceProcessing)&&$(t,e)}},FunctionDeclaration(t,e){if(I(e))return;(t.node.id?t.node.id.name:null)&&(e.file.hasVariants=!1)},ClassDeclaration(t,e){if(I(e))return;(t.node.id?t.node.id.name:null)&&(e.file.hasVariants=!1)},VariableDeclaration(t,e){I(e)||t.node.declarations.forEach(i=>{((0,m.isArrowFunctionExpression)(i.init)||(0,m.isFunctionExpression)(i.init))&&(i.id&&(0,m.isIdentifier)(i.id)&&i.id.name)&&(e.file.hasVariants=!1)})},ImportDeclaration(t,e){const i=ee.concat(e.opts.autoRemapImports??[]).find(r=>e.filename?.includes(r.path));if(i)return M(t,e,i);if(I(e)&&!e.file.replaceWithUnistyles)return;const s=t.node.source.value;s.includes("react-native-unistyles")&&(e.file.hasUnistylesImport=!0,t.node.specifiers.forEach(r=>{(0,m.isImportSpecifier)(r)&&(0,m.isIdentifier)(r.imported)&&r.imported.name==="StyleSheet"&&(e.file.styleSheetLocalName=r.local.name)})),s==="react-native"&&t.node.specifiers.forEach(r=>{(0,m.isImportSpecifier)(r)&&(0,m.isIdentifier)(r.imported)&&Q.includes(r.imported.name)&&(e.reactNativeImports[r.local.name]=r.imported.name)}),s.includes("react-native/Libraries")&&M(t,e,te),!e.file.forceProcessing&&Array.isArray(e.opts.autoProcessImports)&&(e.file.forceProcessing=e.opts.autoProcessImports.includes(s))},JSXElement(t,e){if(!I(e)&&K(t))throw new Error("Detected string based ref which is not supported by Unistyles.")},BlockStatement(t,e){I(e)||G(t,e)},CallExpression(t,e){if(I(e)||!X(t,e)&&!q(t,e))return;e.file.hasAnyUnistyle=!0,J(t,e);const i=t.node.arguments[0];if((0,m.isObjectExpression)(i)){const s=z(t);s&&(0,m.isObjectExpression)(i)&&i.properties.forEach(r=>{(0,m.isObjectProperty)(r)&&(0,m.isIdentifier)(r.key)&&s[r.key.name]&&B(e,r.key.name,r,s[r.key.name]??[])})}if((0,m.isArrowFunctionExpression)(i)||(0,m.isFunctionExpression)(i)){const s=Y(t);if(s){const r=(0,m.isBlockStatement)(i.body)?i.body.body.find(o=>(0,m.isReturnStatement)(o))?.argument:i.body;(0,m.isObjectExpression)(r)&&r.properties.forEach(o=>{(0,m.isObjectProperty)(o)&&(0,m.isIdentifier)(o.key)&&s[o.key.name]&&B(e,o.key.name,o,s[o.key.name]??[])})}}}}}}
//# sourceMappingURL=index.js.map
