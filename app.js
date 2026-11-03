/* リゾペール営業支援サイト デモ - 描画ロジック */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); };

  var state = { entry: 'すべて', tag: 'すべて', kind: 'すべて', evType: 'すべて', showDraft: false, evFocus: null };

  /* ---------- Section6 ---------- */
  var ENTRIES = ['すべて', '皮膚トラブルを繰り返している', 'シャンプーによるケアが難しい', '特定の部位に継続的なケアが必要', '自宅でのケア方法を検討している'];
  var ENTRY_MAP = {
    '皮膚トラブルを繰り返している': function (i) { return i.tags.indexOf('繰り返す') >= 0; },
    'シャンプーによるケアが難しい': function (i) { return i.scene.indexOf('シャンプー困難') >= 0; },
    '特定の部位に継続的なケアが必要': function (i) { return i.scene.indexOf('局所ケア') >= 0; },
    '自宅でのケア方法を検討している': function (i) { return i.scene.indexOf('自宅ケア') >= 0; }
  };

  function allTags() {
    var seen = {}, out = [];
    S6.forEach(function (i) { (i.tags || []).forEach(function (t) { if (!seen[t]) { seen[t] = 1; out.push(t); } }); });
    return out;
  }

  function filterS6() {
    return S6.filter(function (i) {
      if (i.pub !== '公開') return false;
      if (state.kind !== 'すべて' && i.kind !== state.kind) return false;
      if (state.entry !== 'すべて' && !ENTRY_MAP[state.entry](i)) return false;
      if (state.tag !== 'すべて' && i.tags.indexOf(state.tag) < 0) return false;
      return true;
    }).sort(function (a, b) { return a.order - b.order; });
  }

  function evCount(ids) {
    var pub = S7.filter(function (e) { return e.pub === '公開'; });
    var n = { '論文': 0, '症例報告': 0, '現場の使用報告': 0, '基礎研究': 0 };
    (ids || []).forEach(function (id) {
      var e = pub.filter(function (x) { return x.id === id; })[0];
      if (e) n[e.type]++;
    });
    return n;
  }

  function renderS6() {
    var box = $('#s6-list'); if (!box) return;
    var items = filterS6();
    $('#s6-count').textContent = items.length;
    if (!items.length) {
      box.innerHTML = '<div class="empty">該当する項目がありません。条件を変えてお試しください。</div>';
      return;
    }
    box.innerHTML = items.map(function (i) {
      var c = evCount(i.ev);
      var chips = [];
      if (c['論文']) chips.push('論文 ' + c['論文']);
      if (c['症例報告']) chips.push('症例 ' + c['症例報告']);
      if (c['現場の使用報告']) chips.push('使用報告 ' + c['現場の使用報告']);
      return '<article class="item" data-id="' + i.id + '">' +
        '<div class="item-h"><span class="kind kind-' + (i.kind === '治療対象' ? 't' : 's') + '">' + esc(i.kind) + '</span><span class="item-id">' + esc(i.id) + '</span></div>' +
        '<h3>' + esc(i.name) + '</h3>' +
        '<dl class="pair"><dt>着目するポイント</dt><dd>' + esc(i.point) + '</dd>' +
        '<dt>提案につなげる視点</dt><dd>' + esc(i.view) + '</dd></dl>' +
        '<div class="tags">' + i.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') +
        i.scene.map(function (s) { return '<span class="tag scene">' + esc(s) + '</span>'; }).join('') + '</div>' +
        (chips.length ? '<button class="evlink" data-ev="' + i.ev.join(',') + '">根拠：' + chips.join('・') + ' を見る →</button>' : '') +
        '</article>';
    }).join('');
    $$('.evlink', box).forEach(function (b) {
      b.addEventListener('click', function () {
        state.evFocus = b.getAttribute('data-ev').split(',');
        state.evType = 'すべて';
        renderS7();
        document.getElementById('s7').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function renderS6Filters() {
    var e = $('#s6-entries');
    if (e) {
      e.innerHTML = ENTRIES.map(function (t) {
        return '<button class="chip' + (state.entry === t ? ' on' : '') + '" data-entry="' + esc(t) + '">' + esc(t) + '</button>';
      }).join('');
      $$('button', e).forEach(function (b) {
        b.addEventListener('click', function () { state.entry = b.getAttribute('data-entry'); renderS6Filters(); renderS6(); });
      });
    }
    var t = $('#s6-tags');
    if (t) {
      t.innerHTML = ['すべて'].concat(allTags()).map(function (x) {
        return '<button class="chip small' + (state.tag === x ? ' on' : '') + '" data-tag="' + esc(x) + '">' + esc(x) + '</button>';
      }).join('');
      $$('button', t).forEach(function (b) {
        b.addEventListener('click', function () { state.tag = b.getAttribute('data-tag'); renderS6Filters(); renderS6(); });
      });
    }
    var k = $('#s6-kinds');
    if (k) {
      k.innerHTML = ['すべて', '治療対象', '症状・診療テーマ'].map(function (x) {
        return '<button class="chip' + (state.kind === x ? ' on' : '') + '" data-kind="' + esc(x) + '">' + esc(x) + '</button>';
      }).join('');
      $$('button', k).forEach(function (b) {
        b.addEventListener('click', function () { state.kind = b.getAttribute('data-kind'); renderS6Filters(); renderS6(); });
      });
    }
  }


  function docOf(id) { return (typeof DOCS !== 'undefined' ? DOCS.filter(function (d) { return d.id === id; })[0] : null); }

  function docButton(e) {
    var d = e.doc ? docOf(e.doc) : null;
    if (d && d.file) {
      return '<a class="evlink ghost" href="' + esc(d.file) + '" target="_blank" rel="noopener" download>' + esc(d.btn || '資料を開く') + '（PDF ' + esc(d.size) + '）</a>';
    }
    if (d && !d.file) {
      return '<span class="evlink ghost off">資料：' + esc(d.note || 'ご提供待ち') + '</span>';
    }
    return '<span class="evlink ghost off">資料：ご提供待ち</span>';
  }

  /* ---------- Section7 ---------- */
  function renderS7() {
    var box = $('#s7-list'); if (!box) return;
    var types = ['すべて'].concat(S7.filter(function (e) { return e.pub === '公開'; }).map(function (e) { return e.type; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
    var tbox = $('#s7-types');
    tbox.innerHTML = types.map(function (t) {
      var n = t === 'すべて' ? S7.filter(function (e) { return e.pub === '公開'; }).length : S7.filter(function (e) { return e.pub === '公開' && e.type === t; }).length;
      return '<button class="chip' + (state.evType === t ? ' on' : '') + '" data-type="' + esc(t) + '">' + esc(t) + ' ' + n + '</button>';
    }).join('');
    $$('button', tbox).forEach(function (b) {
      b.addEventListener('click', function () { state.evType = b.getAttribute('data-type'); state.evFocus = null; renderS7(); });
    });

    var list = S7.filter(function (e) {
      if (!state.showDraft && e.pub !== '公開') return false;
      if (state.evType !== 'すべて' && e.type !== state.evType) return false;
      if (state.evFocus && state.evFocus.indexOf(e.id) < 0) return false;
      return true;
    }).sort(function (a, b) { return a.order - b.order; });

    if (state.evFocus) {
      $('#s7-focus').innerHTML = '「Section6で選んだ項目」に関連する根拠だけを表示しています。' +
        '<button id="s7-clear">絞り込みを解除</button>';
      $('#s7-clear').addEventListener('click', function () { state.evFocus = null; renderS7(); });
    } else {
      $('#s7-focus').innerHTML = '';
    }

    box.innerHTML = list.map(function (e) {
      var rel = (e.rel || []).map(function (id) {
        var s = S6.filter(function (x) { return x.id === id; })[0];
        return s ? '<span class="tag rel">' + esc(s.name) + '</span>' : '';
      }).join('');
      return '<article class="ecard' + (e.pub === '公開' ? '' : ' draft') + '">' +
        '<div class="item-h"><span class="kind type-' + (e.type === '論文' ? 'p' : e.type === '症例報告' ? 'c' : e.type === '基礎研究' ? 'b' : 'v') + '">' + esc(e.type) + '</span>' +
        (e.year ? '<span class="item-id">' + esc(e.year) + '</span>' : '') +
        (e.pub === '公開' ? '' : '<span class="item-id draft-tag">下書き</span>') + '</div>' +
        '<h3>' + esc(e.title) + '</h3>' +
        '<p class="src">' + esc(e.src) + (e.subject ? '／' + esc(e.subject) : '') + '</p>' +
        '<p>' + esc(e.summary) + '</p>' +
        '<div class="finding"><b>確認された内容</b>' + esc(e.finding) + '</div>' +
        '<div class="tags">' + rel + '</div>' +
        docButton(e) +
        '</article>';
    }).join('') || '<div class="empty">該当する資料がありません。</div>';

    $$('.evlink.ghost', box).forEach(function (b) {
      b.addEventListener('click', function () { alert('デモでは資料ファイルは未接続です。\n公開時は各エビデンスのPDFにリンクします。'); });
    });
  }


  /* ---------- 関連資料 ---------- */
  function renderDocs() {
    var box = $('#dl-list'); if (!box || typeof DOCS === 'undefined') return;
    var cats = ['製品を知る', '根拠を確認する', '使い方を確認する', '営業で活用する'];
    box.innerHTML = cats.map(function (cat) {
      var items = DOCS.filter(function (d) { return d.cat === cat; });
      if (!items.length) return '';
      return '<div class="dlgroup"><p class="flabel">' + esc(cat) + '</p>' + items.map(function (d) {
        var action;
        if (d.href) action = '<a class="dlgo" href="' + esc(d.href) + '">ページ内で見る</a>';
        else if (d.file) action = '<a class="dlgo" href="' + esc(d.file) + '" target="_blank" rel="noopener" download>' + esc(d.btn || 'PDFを開く') + '<span class="sz">' + esc(d.size) + '</span></a>';
        else action = '<span class="dlgo off">' + esc(d.note || 'ご提供待ち') + '</span>';
        return '<div class="dlrow' + (d.pub === '公開' ? '' : ' draft') + '">' +
          '<div class="dltxt"><b>' + esc(d.name) + '</b><span>' + esc(d.desc) + (d.note && d.pub === '公開' ? '　<span class="note-inline">' + esc(d.note) + '</span>' : '') + '</span></div>' + action + '</div>';
      }).join('') + '</div>';
    }).join('');
  }

  /* ---------- Section8 / 9 ---------- */
  function renderS8() {
    var box = $('#s8-list'); if (!box) return;
    box.innerHTML = S8.map(function (c) {
      return '<article class="case">' +
        '<div class="case-no">' + esc(c.no) + '</div>' +
        '<h3>' + esc(c.title) + '</h3>' +
        '<div class="talk">' + c.lines.map(function (l) {
          return '<p><span class="who">' + esc(l[0]) + '</span>' + esc(l[1]) + '</p>';
        }).join('') + '</div>' +
        '<p class="point"><b>ポイント</b>' + esc(c.point) + '</p>' +
        '</article>';
    }).join('');
  }

  function renderS9() {
    var box = $('#s9-list'); if (!box) return;
    box.innerHTML = S9.map(function (g) {
      return '<div class="faq-group"><h3>' + esc(g[0]) + '</h3>' + g[1].map(function (qa) {
        return '<details class="faq"><summary>' + esc(qa[0]) + '</summary><div class="ans">' + esc(qa[1]) + '</div></details>';
      }).join('') + '</div>';
    }).join('');
  }

  /* ---------- init ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    renderS6Filters(); renderS6(); renderS7(); renderS8(); renderS9(); renderDocs();
    var t = $('#draft-toggle');
    if (t) t.addEventListener('change', function () { state.showDraft = t.checked; renderS7(); });
    $$('.nav a').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        var el = document.querySelector(a.getAttribute('href'));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  });
})();
