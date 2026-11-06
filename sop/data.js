/* ==========================================================================
   思想钢印 · SOP 数据
   2026-11-06 起只保留「让步单」一条流程，文案照《支援未来》OTL 原文录入
   一级：每日任务　二级：让步单　三级：让步单查询 / 让步单咨询 / 让步单回复
   ========================================================================== */
window.SOP_DATA = {
  "meta": {
    "version": "v2.0 · 让步单",
    "owner": "施俊臣",
    "updated": "2026-11-06",
    "source": "《支援未来》OTL 大纲",
    "stats": { "flows": 1, "steps": 3, "ops": 16, "with_checks": 0, "with_exc": 0, "with_out": 0, "no_trigger": 1 },
    "manifesto": [],
    "history": []
  },

  "domains": [
    { "id": "DAY", "name": "每日任务", "en": "DAILY" }
  ],

  "flows": [
    {
      "id": "DAY-001",
      "domain": "DAY",
      "code": "SOP-DAY-001",
      "title": "让步单",
      "h1": "让步单",
      "raw_title": "销售 · 让步单",
      "version": "v2.0",
      "owner": "施俊臣",
      "updated": "2026-11-06",
      "lead": [],
      "trigger": [],
      "inputs": [],
      "done": "",
      "sla": "—",
      "roles": "施俊臣",
      "systems": ["宝时达", "QQ", "微信"],
      "en": "",
      "ops": 16,

      "steps": [
        {
          "n": 1,
          "title": "让步单查询",
          "summary": "",
          "code": false,
          "ops": 6,
          "kind": "action",
          "actions": [
            "打开（Open）【宝时达】",
            "进入（Go to）〈全部菜单〉→〈订单管理〉→〈让步接收单〉",
            "截图（Ctrl + Alt + A）",
            "框选（Drag-select）从 [ 让步申请单号 ] 到 [ 交货月 ]",
            "明细：让步申请单号、钢厂订单号、变更原因、变更描述、规格、牌号、品种、制造单元、交货月",
            "点击（Left Click）〈完成〉"
          ],
          "systems": ["宝时达"],
          "outputs": [],
          "checks": [],
          "exceptions": [],
          "pitfalls": [],
          "raw": []
        },
        {
          "n": 2,
          "title": "让步单咨询",
          "summary": "",
          "code": false,
          "ops": 4,
          "kind": "action",
          "actions": [
            "打开（Open）【QQ】或【微信】",
            "粘贴（Ctrl + V）[ 对话框 ]",
            "输入（Type）[ 输入框 ]“领导这个让步单要吗”",
            "点击（Left Click）〈发送〉"
          ],
          "systems": ["宝时达", "QQ", "微信"],
          "outputs": [],
          "checks": [],
          "exceptions": [],
          "pitfalls": [],
          "raw": []
        },
        {
          "n": 3,
          "title": "让步单回复",
          "summary": "",
          "code": false,
          "ops": 6,
          "kind": "action",
          "actions": [
            "打开（Open）【宝时达】",
            "进入（Go to）〈全部菜单〉→〈订单管理〉→〈让步接收单〉",
            "点击（Left Click）〈操作 - 让步接收单确认〉",
            "点击（Left Click）〈同意〉或〈不同意〉",
            "输入（Type）[ 回复意见 ]“用户同意接受”或“用户不同意接受”",
            "点击（Left Click）〈提交〉"
          ],
          "systems": ["宝时达"],
          "outputs": [],
          "checks": [],
          "exceptions": [],
          "pitfalls": [],
          "raw": []
        }
      ],

      "faq": []
    }
  ],

  "documents": [],
  "terms": [],
  "audit": []
};
