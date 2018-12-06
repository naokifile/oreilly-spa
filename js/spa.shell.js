/*
 * spa.shell.js
 * SPAのシェルモジュール
 */

 /*jslint           browser : true, continue    : true,
    devel  : true,  indent  : 2,    maxerr      : 50,
    newcap : true,  nomen   : true, plusplus    : true,
    regexp : true,  sloppy  : true, vars        : false,
    white  : true
*/

/*global $, spa */
spa.shell = (function(){
    // ------------ モジュールスコープ変数開始 ------------
    var
        configMap = {
            anchor_schema_map:{
                chat: {open: true, closed: true}
            },
            main_html : String()
                + '<div class="spa-shell-head">'
                    + '<div class="spa-shell-head-logo"></div>'
                    + '<div class="spa-shell-head-acct"></div>'
                    + '<div class="spa-shell-head-search"></div>'
                + '</div>'
                + '<div class="spa-shell-main">'
                    + '<div class="spa-shell-main-nav"></div>'
                    + '<div class="spa-shell-main-content"></div>'
                + '</div>'
                + '<div class="spa-shell-foot"></div>'
                + '<div class="spa-shell-chat"></div>'
                + '<div class="spa-shell-modal"></div>',
            chat_extended_time    : 1000,
            chat_retracted_time   : 300,
            chat_extended_height  : 450,
            chat_retracted_height : 15,
            chat_extended_title : 'Click to retract',
            chat_retracted_title  : 'Click to extend',
        },
        stateMap = {
            $container          : null,
            anchor_map          : {},
            is_chat_retracted   : true,
        },
        jqueryMap = {},
        copyAnchorMap, setJqueryMap, toggleChat, 
        changeAnchorPart, onHashchange,
        onClickChat, initModule;
    // ------------ モジュールスコープ変数終了 ------------

    // ------------ ユーティリティメソッド変数開始 ------------
    // 格納したアンカーマップのコピーを返す。オーバヘッドを最小限にする
    copyAnchorMap = function(){
        return $.extend( true, {}, stateMap.anchor_map);
    }
    // ------------ ユーティリティメソッド変数終了 ------------

    // ------------ DOMメソッド開始 ------------
    // DOMメソッド/setJqueryMap/開始
    setJqueryMap = function(){
        var $container = stateMap.$container;
        jqueryMap = {
            $container : $container,
            $chat : $container.find('.spa-shell-chat'),
        };
    };
    // DOMメソッド/setJqueryMap/終了

    // DOMメソッド/toggleChat/開始
    // 目的 : チャットスライダーの拡大や格納
    // 引数 :
    //  * do_extend - trueの場合、スライダーを拡大する。falseの場合は格納する
    //  * callback - アニメーションの最後に実行するオプション関数
    // 設定 :
    //  * chat_extend_time, chat_retract_time
    //  * chat_extend_height, chat_retract_height
    // 戻り値 : boolean
    //  * true - スライダーアニメーションが開始された
    //  * false - スライダーアニメーションが開始されなかった
    // 状態 : stateMap.is_chat_retracted
    //  * true - スライダーは格納されている
    //  * false - スライダーは拡大されている
    //
    toggleChat = function(do_extend, callback){
        var
            px_chat_ht = jqueryMap.$chat.height(),
            is_open = px_chat_ht === configMap.chat_extended_height,
            is_closed = px_chat_ht === configMap.chat_retracted_height,
            is_sliding =! is_open && ! is_closed;

        // 競合状態を避ける
        if(is_sliding){ return false; }

        // チャットスライダーの拡大開始
        if(do_extend){
            jqueryMap.$chat.animate(
                { height : configMap.chat_extended_height},
                configMap.chat_extend_time,
                function(){
                    jqueryMap.$chat.attr(
                        'title', configMap.chat_extended_title
                    );
                    stateMap.is_chat_retracted = false;
                    if(callback){ callback( jqueryMap.$chat);}
                }
            );
            return true;
        }
        // チャットスライダーの拡大終了

        // チャットスライダーの格納開始
        jqueryMap.$chat.animate(
            { height : configMap.chat_retracted_height},
            configMap.chat_retracted_time,
            function(){
                jqueryMap.$chat.attr(
                    'title', configMap.chat_retracted_title,
                );
                stateMap.is_chat_retracted = true;
                if(callback){ callback( jqueryMap.$chat);}
            }
        );
        return true;
        // チャットスライダーの格納終了
    };
    // DOMメソッド/toggleChat/終了

    // DOMメソッド/changeAnchorPart/開始
    // 目的: URIアンカー要素部分を変更する
    // 引数:
    //  * arg_map - 変更したいURIアンカー部分を表すマップ
    // 戻り値: boolean
    //  * true - URIのアンカー部分が更新された
    //  * false - URIのアンカー部分を更新できなかった
    // 動作:
    // 現在のアンカーをstatemap.anchor_mapに格納する
    // エンコーディングの説明はuriAnchorを参照。
    // このメソッドは
    //  * copyAnchorMap()を使って子のマップのコピーを作成する
    //  * arg_mapを使ってキーバリューを修正する
    //  * エンコーディングの独立地と従属値の区別を管理する
    //  * uriAnchorを使ってURIの変更を試みる
    //  * 成功時にはtrue,失敗時にはfalseを返す
    //
    changeAnchorPart = function (arg_map){
        var
            anchor_map_revise = copyAnchorMap(),
            bool_return = true,
            key_name, key_name_dep;

        // アンカーマップへ変更を統合開始
        KEYVAL:
        for( key_name in arg_map){
            if(arg_map.hasOwnProperty(key_name)){
                // 反復中に従属キーを飛ばす
                if(key_name.indexOf('_') === 0){ continue KEYVAL;}

                // 独立キー値を更新する
                anchor_map_revise[key_name] = arg_map[key_name];

                // 合致する独立キーを更新する
                key_name_dep = '_' + key_name;
                if(arg_map[key_name_dep]){
                    anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
                }
                else{
                    delete anchor_map_revise[key_name_dep];
                    delete anchor_map_revise['_S' + key_name_dep];
                }
            }
        }
        // アンカーマップへ変更を統合終了

        // URIの更新開始 成立しなければ元に戻す。
        // 12xページくらい
    }
    // ------------ DOMメソッド終了 ------------

    // ------------ イベントハンドラ開始 ------------
    onClickChat = function(event){
        if(toggleChat( stateMap.is_chat_retracted)){
            $.uriAnchor.setAnchor({
                chat: (stateMap.is_chat_retracted ? 'open' : 'closed')
            })
        }
        return false;
    }
    // ------------ イベントハンドラ終了 ------------

    // ------------ パブリックメソッド開始 ------------
    // パブリックメソッド/initModule/開始
    initModule = function($container){
        stateMap.$container = $container;
        $container.html( configMap.main_html);
        setJqueryMap();

        // チャットスライダーを初期化し、クリックイベントハンドラをバインドする
        stateMap.is_chat_retracted = true;
        jqueryMap.$chat
            .attr('title', configMap.chat_retracted_title)
            .click(onClickChat);
    };
    // パブリックメソッド/initModule/終了
    return {initModule: initModule};
    // ------------ パブリックメソッド終了 ------------
}());
