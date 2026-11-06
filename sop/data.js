/* ==========================================================================
   思想钢印 · SOP 数据
   每日任务：让步单 / 插行
   ========================================================================== */
window.SOP_DATA = {
  "meta": {
    "version": "v3.0 · 每日任务",
    "owner": "施俊臣",
    "updated": "2026-11-06",
    "source": "《支援未来》OTL 大纲",
    "stats": {
      "flows": 2,
      "steps": 6,
      "ops": 65,
      "with_checks": 0,
      "with_exc": 0,
      "with_out": 0,
      "no_trigger": 1
    },
    "manifesto": [],
    "history": []
  },
  "domains": [
    {
      "id": "DAY",
      "name": "每日任务",
      "en": "DAILY"
    }
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
      "systems": [
        "宝时达",
        "QQ",
        "微信"
      ],
      "en": "",
      "ops": 17,
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
          "systems": [
            "宝时达"
          ],
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
          "systems": [
            "宝时达",
            "QQ",
            "微信"
          ],
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
          "ops": 7,
          "kind": "action",
          "actions": [
            "打开（Open）【宝时达】",
            "进入（Go to）〈全部菜单〉→〈订单管理〉→〈让步接收单〉",
            "点击（Left Click）〈让步接收单确认〉",
            "点击（Left Click）〈同意〉或〈不同意〉",
            "输入（Type）[ 回复意见 ]“用户同意接受”或“用户不同意接受”",
            "点击（Left Click）〈提交〉",
            "点击（Left Click）〈确定〉"
          ],
          "systems": [
            "宝时达"
          ],
          "outputs": [],
          "checks": [],
          "exceptions": [],
          "pitfalls": [],
          "raw": []
        }
      ],
      "faq": []
    },
    {
      "id": "DAY-002",
      "domain": "DAY",
      "code": "SOP-DAY-002",
      "title": "插行",
      "h1": "插行",
      "raw_title": "销售 · 插行",
      "version": "v1.0",
      "owner": "施俊臣",
      "updated": "2026-11-06",
      "lead": [],
      "trigger": [],
      "inputs": [],
      "done": "",
      "sla": "—",
      "roles": "施俊臣",
      "systems": [
        "宝时达",
        "下载文件",
        "台账"
      ],
      "en": "",
      "ops": 48,
      "steps": [
        {
          "n": 1,
          "title": "准发下载",
          "summary": "",
          "code": false,
          "ops": 8,
          "kind": "action",
          "actions": [
            "打开（Open）【宝时达】",
            "进入（Go to）〈全部菜单〉→〈货物管理〉→〈准发〉",
            "点击（Left Click）〈查询请点我〉",
            "点击（Left Click）〈重置〉",
            "输入（Type）[ 交货期起 ]“交货期起”",
            "输入（Type）[ 交货期止 ]“交货期止”",
            "点击（Left Click）〈查询〉",
            "点击（Left Click）〈捆包（顺序号）下载〉"
          ],
          "systems": [
            "宝时达"
          ],
          "outputs": [],
          "checks": [],
          "exceptions": [],
          "pitfalls": [],
          "raw": []
        },
        {
          "n": 2,
          "title": "整理表格",
          "summary": "",
          "code": false,
          "ops": 26,
          "kind": "action",
          "actions": [
            "打开（Open）【下载文件】",
            "复制（Ctrl + C）[ 钢厂订单号（A） ]",
            "复制（Ctrl + C）[ 捆包号（C） ]",
            "复制（Ctrl + C）[ 净重（F） ]",
            "复制（Ctrl + C）[ 准发毛重（G） ]",
            "打开（Open）【下载文件 · Sheet1】",
            "粘贴（Ctrl + V）",
            "右键（Right Click）[ 净重（C） ]（在右侧插入列）",
            "剪切（Ctrl + X）[ 钢厂订单号（A） ]",
            "粘贴（Ctrl + V）[ D 列 ]",
            "右键（Right Click）[ A 列 ]（删除列）",
            "输入（Type）[ 捆包号（A） ]（把该列转换为数字）",
            "打开（Open）【台账】",
            "右键（Right Click）以下列（逐列隐藏）",
            "明细：销售单价（AH）、销售金额（AI）、销售合同总额（AJ）、计息基准日（AK）、利率（AL）、最后提货日（AM）、逾期利率（AN）、计息天数（AO）、逾期计息天数（AP）、销售含息单价（AQ）、销售含息总价（AR）、利息（AS）、销售合同号（AT）、C9采购合同编号（AU）、C9销售单据编号（AV）、付款方式（AW）、销售合同状态（AX）、部门（AY）、供应商（AZ）、采购合同（BA）、采购单价含税（BB）、采购总额（BC）、采购合同总额（BD）、价格方式（BE）、钢贸-海运费预计单价（含税）（BF）、钢贸-海运费预计金额（含税）（BG）、单价（不含税）（BH）、金额（不含税）（BI）、股份出厂备注（BJ）、实到发票运费单价9%（不含税）（BK）、实到发票运费金额9%（不含税）（BL）、延伸库单价6%（不含税）（BM）、延伸库金额6%（不含税）（BN）、毛利（BO）、计息（BP）、出厂运输变更（BQ）、备注1（BR）、备注2（BS）",
            "复制（Ctrl + C）[ 台账 · 钢厂资源号（AF） ]",
            "打开（Open）【下载文件 · Sheet1】",
            "粘贴（Ctrl + V）[ F 列 ]",
            "输入（Type）[ E 列 ]（= VLOOKUP（钢厂订单号（C），F：G，2，0））",
            "填充（Ctrl + D）[ E 列 ]",
            "打开（Open）【台账】",
            "复制（Ctrl + C）[ 台账 · 捆包号（S） ]",
            "打开（Open）【下载文件 · Sheet1】",
            "粘贴（Ctrl + V）[ 捆包号（A） ]",
            "数字格式（Alt + 2）[ 捆包号（A） ]",
            "筛选（Filter）[ E 列 ]（保留 0）",
            "筛选（Filter）[ 捆包号（A） ]（颜色：无填充）",
            "复制（Ctrl + C）[ 捆包号（A） ]",
            "复制（Ctrl + C）[ 净重（B） ]",
            "复制（Ctrl + C）[ 钢厂订单号（C） ]",
            "打开（Open）【下载文件 · Sheet2】",
            "粘贴（Ctrl + V）",
            "右键（Right Click）[ 捆包号（A） ]（列宽 20）",
            "右键（Right Click）[ 钢厂订单号（C） ]（列宽 20）",
            "复制（Ctrl + C）[ 捆包号（A） ]",
            "复制（Ctrl + C）[ 钢厂订单号（C） ]",
            "打开（Open）【台账】",
            "粘贴（Ctrl + V）[ 台账 · （BX） ]"
          ],
          "systems": [
            "下载文件",
            "台账"
          ],
          "outputs": [],
          "checks": [],
          "exceptions": [],
          "pitfalls": [],
          "raw": []
        },
        {
          "n": 3,
          "title": "台账编辑",
          "summary": "",
          "code": false,
          "ops": 20,
          "kind": "action",
          "actions": [
            "打开（Open）【下载文件 · Sheet2】",
            "筛选（Filter）[ 钢厂订单号（C） ]（单个资源号）",
            "复制（Ctrl + C）[ 钢厂订单号（C） ]",
            "打开（Open）【台账】",
            "查找（Ctrl + F）[ 台账 · 钢厂资源号（AF） ]",
            "粘贴（Ctrl + V）[ 台账 · 钢厂资源号（AF） ]",
            "Enter",
            "Esc",
            "右键（Right Click）[ 钢厂资源号（AF） ]（在下方插入行）",
            "⚠注意：若 [ 捆包号（S） ] 为空，则插入行数 = 捆包号数量 − 1",
            "⚠若捆包号数量为 1，右键后直接按 B（在下方插入一行）",
            "打开（Open）【下载文件 · Sheet2】",
            "复制（Ctrl + C）[ 捆包号（A） ]",
            "复制（Ctrl + C）[ 净重（B） ]",
            "打开（Open）【台账】",
            "粘贴（Ctrl + V）[ 台账 · 捆包号（S） ]",
            "填充（Ctrl + D）以下列（逐列下拉）",
            "明细：期别（Z）、品名（AA）、产地（AB）、牌号（AC）、规格（AD）、仓库（AE）、钢厂资源号（AF）、客户（AG）、期别（AH）、销售金额（AI）、销售合同总额（AJ）、计息基准日（AK）、利率（AL）、最后提货日（AM）、逾期利率（AN）、计息天数（AO）、逾期计息天数（AP）、销售含息单价（AQ）、销售含息总价（AR）、利息（AS）、销售合同号（AT）、C9采购合同编号（AU）、C9销售单据编号（AV）、付款方式（AW）、销售合同状态（AX）、部门（AY）、供应商（AZ）、采购合同（BA）、采购单价含税（BB）、采购总额（BC）、采购合同总额（BD）、价格方式（BE）、钢贸-海运费预计单价（含税）（BF）、钢贸-海运费预计金额（含税）（BG）、单价（不含税）（BH）、金额（不含税）（BI）、股份出厂备注（BJ）、实到发票运费单价9%（不含税）（BK）、实到发票运费金额9%（不含税）（BL）、延伸库单价6%（不含税）（BM）、延伸库金额6%（不含税）（BN）、毛利（BO）、计息（BP）、出厂运输变更（BQ）、备注1（BR）、备注2（BS）、最终客户（BT）、凡川出入库统计（BU）、串行校验列（BV）、（BW）",
            "⚠[ （BV） ] 为 TRUE，则正确，重复至完成",
            "⚠[ （BV） ] 为 FALSE，则错误，需检查原因",
            "打开（Open）【下载文件 · Sheet1】",
            "复制（Ctrl + C）[ 捆包号（A） ]",
            "复制（Ctrl + C）[ 准发毛重（D） ]",
            "打开（Open）【台账】",
            "粘贴（Ctrl + V）[ 台账 · （BX） ]",
            "筛选（Filter）[ 台账 · （BW） ]（非 #N/A）",
            "复制（Ctrl + C）[ 台账 · （BW） ]",
            "右键（Right Click）[ 台账 · 毛重（R） ]（粘贴值到可见单元格）",
            "保存（Ctrl + S）[ 台账 ]"
          ],
          "systems": [
            "下载文件",
            "台账"
          ],
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
