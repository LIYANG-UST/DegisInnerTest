const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const Fortmatic = window.Fortmatic;
const evmChains = window.evmChains;

let web3Modal;
let provider;
let web3;
let selectedAccount;
let contracts = {};
let Address = {};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ifConnected() {
  if (provider == null) {
    alert("Please connect wallet");
  }
}

function init() {
  console.log("Initializing example");
  console.log("WalletConnectProvider is", WalletConnectProvider);
  console.log("Fortmatic is", Fortmatic);
  console.log(
    "window.web3 is",
    window.web3,
    "window.ethereum is",
    window.ethereum
  );

  // Check that the web page is run in a secure context,
  // as otherwise MetaMask won't be available
  //   if (location.protocol !== "https:") {
  //     // https://ethereum.stackexchange.com/a/62217/620
  //     const alert = document.querySelector("#alert-error-https");
  //     alert.style.display = "block";
  //     document.querySelector("#btn-connect").setAttribute("disabled", "disabled");
  //     return;
  //   }

  // Tell Web3modal what providers we have available.
  // Built-in web browser provider (only one can exist as a time)
  // like MetaMask, Brave or Opera is added automatically by Web3modal
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        // Mikko's test key - don't copy as your mileage may vary
        infuraId: "8043bb2cf99347b1bfadfb233c5325c0",
      },
    },

    fortmatic: {
      package: Fortmatic,
      options: {
        // Mikko's TESTNET api key
        key: "pk_test_391E26A3B43A3350",
      },
    },
  };

  web3Modal = new Web3Modal({
    cacheProvider: false, // optional
    providerOptions, // required
    disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
  });

  console.log("Web3Modal instance is", web3Modal);
}

async function initContract() {
  $.getJSON("../abis/DegisToken.json", function (data) {
    contracts.DegisToken = TruffleContract(data);
    contracts.DegisToken.setProvider(provider);
  });
  $.getJSON("../abis/InsurancePool.json", function (data) {
    contracts.InsurancePool = TruffleContract(data);
    contracts.InsurancePool.setProvider(provider);
  });
  $.getJSON("../abis/PolicyFlow.json", function (data) {
    contracts.PolicyFlow = TruffleContract(data);
    contracts.PolicyFlow.setProvider(provider);
  });
  $.getJSON("../abis/PolicyToken.json", function (data) {
    contracts.PolicyToken = TruffleContract(data);
    contracts.PolicyToken.setProvider(provider);
  });
  $.getJSON("../abis/LPToken.json", function (data) {
    contracts.LPToken = TruffleContract(data);
    contracts.LPToken.setProvider(provider);
  });
  $.getJSON("../abis/MockUSD.json", function (data) {
    contracts.MockUSD = TruffleContract(data);
    contracts.MockUSD.setProvider(provider);
  });
  $.getJSON("../abis/LinkTokenInterface.json", function (data) {
    contracts.LinkTokenInterface = TruffleContract(data);
    contracts.LinkTokenInterface.setProvider(provider);
  });
  $.getJSON("../abis/DegisLottery.json", function (data) {
    contracts.DegisLottery = TruffleContract(data);
    contracts.DegisLottery.setProvider(provider);
  });
  $.getJSON("../abis/RandomNumberGenerator.json", function (data) {
    contracts.RandomNumberGenerator = TruffleContract(data);
    contracts.RandomNumberGenerator.setProvider(provider);
  });
}

async function initContractAddress() {
  $.getJSON("../address.json", function (data) {
    Address.DegisToken = data.DegisToken;
    console.log("degistoken address is", data.DegisToken);

    Address.LPToken = data.LPToken;
    Address.MockUSD = data.MockUSD;
    Address.InsurancePool = data.InsurancePool;
    Address.PolicyFlow = data.PolicyFlow;
    Address.PolicyToken = data.PolicyToken;
    Address.LinkTokenInterface = data.LinkTokenInterface;
    Address.EmergencyPool = data.EmergencyPool;
    Address.GetRandomness = data.GetRandomness;
    Address.DegisLottery = data.DegisLottery;
    Address.RandomNumberGenerator = data.RandomNumberGenerator;
  });
}

function bindEvents() {
  $(document).on("click", ".btn-passMinter", passMinter);
  $(document).on("click", ".btn-faucet", Faucet);
  $(document).on("click", ".btn-mintNFT", MintNFT);
  $(document).on("click", ".btn-checkusd", CheckUSDBalance);
  $(document).on("click", ".btn-stake", Stake);
  $(document).on("click", ".btn-unstake", Unstake);
  $(document).on("click", ".btn-poolinfo", GetPoolInfo);
  $(document).on("click", ".btn-lpinfo", GetLPInfo);
  $(document).on("click", ".btn-updatePolicyFlow", UpdatePolicyFlow);
  $(document).on("click", ".btn-newpolicy", NewPolicy);
  $(document).on("click", ".btn-oracle", NewSettlement);
  $(document).on("click", ".btn-harvestpremium", HarvestPremium);
  $(document).on("click", ".btn-harvestdegis", HarvestDegis);
  $(document).on("click", ".btn-showuserpolicy", ShowUserPolicy);
  $(document).on("click", ".btn-setLottery", StartLottery);
  $(document).on("click", ".btn-settleLottery", SettleLottery);
  $(document).on("click", ".btn-buyticket", BuyTicket);
  $(document).on("click", ".btn-lotteryinfo", ShowLotteryInfo);
  $(document).on("click", ".btn-injectLottery", InjectFunds);
  $(document).on("click", ".btn-claimAll", ClaimAllTickets);
}

async function fetchAccountData() {
  // Get a Web3 instance for the wallet
  // const web3 = new Web3(provider);

  console.log("Web3 instance is", web3);

  // Get connected chain id from Ethereum node
  const chainId = await web3.eth.getChainId();
  // Load chain information over an HTTP API
  const chainData = evmChains.getChain(chainId);
  document.querySelector("#network-name").textContent = chainData.name;

  // Get list of accounts of the connected wallet
  const accounts = await web3.eth.getAccounts();

  // MetaMask does not give you all accounts, only the selected account
  console.log("Got accounts", accounts);
  selectedAccount = accounts[0];

  document.querySelector("#selected-account").textContent = selectedAccount;

  // Get a handl
  const template = document.querySelector("#template-balance");
  const accountContainer = document.querySelector("#accounts");

  // Purge UI elements any previously loaded accounts
  accountContainer.innerHTML = "";

  // Go through all accounts and get their ETH balance
  const rowResolvers = accounts.map(async (address) => {
    const balance = await web3.eth.getBalance(address);
    // ethBalance is a BigNumber instance
    // https://github.com/indutny/bn.js/
    const ethBalance = web3.utils.fromWei(balance, "ether");
    const humanFriendlyBalance = parseFloat(ethBalance).toFixed(4);
    // Fill in the templated row and put in the document
    const clone = template.content.cloneNode(true);
    clone.querySelector(".address").textContent = address;
    clone.querySelector(".balance").textContent = humanFriendlyBalance;
    accountContainer.appendChild(clone);
  });

  // Because rendering account does its own RPC commucation
  // with Ethereum node, we do not want to display any results
  // until data for all accounts is loaded
  await Promise.all(rowResolvers);

  // Display fully loaded UI for wallet data
  document.querySelector("#prepare").style.display = "none";
  document.querySelector("#connected").style.display = "block";
}

async function refreshAccountData() {
  // If any current data is displayed when
  // the user is switching acounts in the wallet
  // immediate hide this data
  document.querySelector("#connected").style.display = "none";
  document.querySelector("#prepare").style.display = "block";

  // Disable button while UI is loading.
  // fetchAccountData() will take a while as it communicates
  // with Ethereum node via JSON-RPC and loads chain data
  // over an API call.
  document.querySelector("#btn-connect").setAttribute("disabled", "disabled");
  await fetchAccountData(provider);
  document.querySelector("#btn-connect").removeAttribute("disabled");
}

async function onConnect() {
  console.log("Opening a dialog", web3Modal);
  try {
    provider = await web3Modal.connect();
  } catch (e) {
    console.log("Could not get a wallet connection", e);
    return;
  }

  // Subscribe to accounts change
  provider.on("accountsChanged", (accounts) => {
    fetchAccountData();
  });

  // Subscribe to chainId change
  provider.on("chainChanged", (chainId) => {
    fetchAccountData();
  });

  // Subscribe to networkId change
  provider.on("networkChanged", (networkId) => {
    fetchAccountData();
  });

  document.querySelector("#nomessage").style.display = "none";
  web3 = new Web3(provider);
  await refreshAccountData();
  await initContract();
  await initContractAddress();
}

async function onDisconnect() {
  console.log("Killing the wallet connection", provider);

  // TODO: Which providers have close method?
  if (provider.close) {
    await provider.close();

    // If the cached provider is not cleared,
    // WalletConnect will default to the existing session
    // and does not allow to re-scan the QR code with a new wallet.
    // Depending on your use case you may want or want not his behavir.
    await web3Modal.clearCachedProvider();
    provider = null;
  }

  selectedAccount = null;

  // Set the UI back to the initial state
  document.querySelector("#prepare").style.display = "block";
  document.querySelector("#connected").style.display = "none";
  document.querySelector("#nomessage").style.display = "block";
}

async function passMinter() {
  ifConnected();
  const degis = await contracts.DegisToken.at(Address.DegisToken);
  const degis_balance = await degis.balanceOf(selectedAccount);
  console.log("user Degis balance:", parseInt(degis_balance) / 10 ** 18);

  const lptoken = await contracts.LPToken.at(Address.LPToken);
  console.log("LP Token address:", lptoken.address);

  const minter1 = await degis.minter.call();
  const minter2 = await lptoken.minter.call();
  if (minter1 == Address.InsurancePool && minter2 == Address.InsurancePool) {
    alert("The minter addrress has already been set!");
  } else {
    const minter_d = await degis.passMinterRole(Address.InsurancePool, {
      from: selectedAccount,
    });
    console.log("New Degis Minter Address:", minter_d.logs[0].args[1]);
    const minter_l = await lptoken.passMinterRole(Address.InsurancePool, {
      from: selectedAccount,
    });
    console.log("New LPToken Minter Address:", minter_l.logs[0].args[1]);
  }
}

async function UpdatePolicyFlow() {
  ifConnected();

  const PolicyToken = await contracts.PolicyToken.at(Address.PolicyToken);
  const InsurancePool = await contracts.InsurancePool.at(Address.InsurancePool);

  const tx1 = await InsurancePool.setPolicyFlow(Address.PolicyFlow, {
    from: selectedAccount,
  });
  console.log("Tx Hash:", tx1.tx);

  const pf_add = await InsurancePool.policyFlow.call({ from: selectedAccount });
  console.log("Policy flow in the pool:", pf_add);

  const tx2 = await PolicyToken.updatePolicyFlow(Address.PolicyFlow, {
    from: selectedAccount,
  });
  console.log(tx2.tx);
}

async function CheckUSDBalance() {
  ifConnected();
  const MockUSD = await contracts.MockUSD.at(Address.MockUSD);
  console.log("MockUSD Address:", MockUSD.address);

  let usd_balance = await MockUSD.balanceOf(selectedAccount);
  document.getElementById("usdbalance").innerText =
    "Your MockUSD Balance: " + usd_balance / 10 ** 18;
}

async function Faucet() {
  ifConnected();
  const MockUSD = await contracts.MockUSD.at(Address.MockUSD);
  console.log("MockUSD Address:", MockUSD.address);
  let faucet_number = document.getElementById("faucet_amount").value;
  if (faucet_number == 0) {
    alert("please type in your amount");
  } else {
    faucet_number = web3.utils.toWei(faucet_number, "ether");
    console.log("Faucet Number:", faucet_number);

    const tx = await MockUSD.mint(selectedAccount, faucet_number, {
      from: selectedAccount,
    });
    console.log(tx.tx);
  }
}

async function Stake() {
  ifConnected();

  const MockUSD = await contracts.MockUSD.at(Address.MockUSD);
  console.log("MockUSD Address:", MockUSD.address);
  const InsurancePool = await contracts.InsurancePool.at(Address.InsurancePool);
  console.log("InsurancePoll Address:", InsurancePool.address);

  deposit_amount = document.getElementById("stake_amount").value;
  f_amount = web3.utils.toWei(deposit_amount, "ether");

  const tx1 = await MockUSD.approve(
    Address.InsurancePool,
    web3.utils.toBN(f_amount),
    {
      from: selectedAccount,
    }
  );
  console.log("Tx Hash:", tx1.tx);

  const tx2 = await InsurancePool.stake(
    selectedAccount,
    web3.utils.toBN(f_amount),
    {
      from: selectedAccount,
    }
  );
  console.log("Tx Hash:", tx2.tx);
}

async function Unstake() {
  ifConnected();

  const InsurancePool = await contracts.InsurancePool.at(Address.InsurancePool);
  console.log("InsurancePoll Address:", InsurancePool.address);

  deposit_amount = document.getElementById("stake_amount").value;
  f_amount = web3.utils.toWei(deposit_amount, "ether");

  const tx = await InsurancePool.unstake(
    selectedAccount,
    web3.utils.toBN(f_amount),
    {
      from: selectedAccount,
    }
  );
  console.log("Tx Hash:", tx.tx);
}

async function GetPoolInfo() {
  ifConnected();

  const MockUSD = await contracts.MockUSD.at(Address.MockUSD);
  const InsurancePool = await contracts.InsurancePool.at(Address.InsurancePool);
  console.log("InsurancePool address:", InsurancePool.address);

  let poolinfo = document.getElementById("poolinfo");
  poolinfo.innerText = "Pool Info";

  await InsurancePool.getPoolName({ from: selectedAccount }).then((value) =>
    console.log("Pool name:", value)
  );

  await InsurancePool.getCurrentStakingBalance({ from: selectedAccount }).then(
    (value) => {
      console.log(
        "Current Staking Balance in the pool:",
        parseInt(value) / 10 ** 18
      );
      poolinfo.innerText += "\nCurrent Staking Value: " + value / 10 ** 18;
    }
  );

  await InsurancePool.getAvailableCapacity({ from: selectedAccount }).then(
    (value) => {
      console.log(
        "Available capacity in the pool:",
        parseInt(value) / 10 ** 18
      );
      poolinfo.innerText += "\nAvailable Capacity: " + value / 10 ** 18;
    }
  );

  await InsurancePool.getTotalLocked({ from: selectedAccount }).then(
    (value) => {
      console.log(
        "Total locked amount in the pool:",
        parseInt(value) / 10 ** 18
      );
      poolinfo.innerText += "\nTotal Locked: " + value / 10 ** 18;
    }
  );

  await InsurancePool.getLockedRatio({ from: selectedAccount }).then((value) =>
    console.log("PRB locked Ratio:", parseInt(value) / 10 ** 18)
  );

  await MockUSD.balanceOf(Address.InsurancePool, {
    from: selectedAccount,
  }).then((value) =>
    console.log("Total USDC balance in the pool:", parseInt(value) / 10 ** 18)
  );

  await MockUSD.allowance(selectedAccount, Address.InsurancePool, {
    from: selectedAccount,
  }).then((value) =>
    console.log("USDC allowance of the pool:", parseInt(value) / 10 ** 18)
  );

  const reward_collected = await InsurancePool.getRewardCollected();
  console.log("reward collected:", parseInt(reward_collected) / 10 ** 18);

  const pf_add = await InsurancePool.policyFlow.call();
  console.log("policy flow in the pool:", pf_add);

  await GetAllPolicyInfo();
}

async function GetLPInfo() {
  ifConnected();

  const InsurancePool = await contracts.InsurancePool.at(Address.InsurancePool);
  const LPToken = await contracts.LPToken.at(Address.LPToken);

  let lpinfo = document.getElementById("poolinfo");
  lpinfo.innerText = "LP Info";

  await InsurancePool.getStakeAmount(selectedAccount, {
    from: selectedAccount,
  }).then((value) => {
    console.log("Your stake amount:", parseInt(value) / 10 ** 18);
    lpinfo.innerText += "\nStake amount: " + parseInt(value) / 10 ** 18;
  });

  await InsurancePool.getUnlockedfor(selectedAccount, {
    from: selectedAccount,
  }).then((value) => {
    console.log("Your unlocked amount:", parseInt(value) / 10 ** 18);
    lpinfo.innerText += "\nUnlocked amount: " + parseInt(value) / 10 ** 18;
  });

  await InsurancePool.getLockedfor(selectedAccount, {
    from: selectedAccount,
  }).then((value) => {
    console.log("Your locked amount:", parseInt(value) / 10 ** 18);
    lpinfo.innerText += "\nLocked amount: " + parseInt(value) / 10 ** 18;
  });

  await InsurancePool.getRealBalance(selectedAccount, {
    from: selectedAccount,
  }).then((value) => {
    console.log("Your real balance:", parseInt(value) / 10 ** 18);
    lpinfo.innerText += "\nReal balance: " + parseInt(value) / 10 ** 18;
  });

  const lpvalue = await InsurancePool.LPValue.call({ from: selectedAccount });
  const lpnum = await LPToken.balanceOf(selectedAccount);
  lpinfo.innerText += "\nLP Value: " + parseInt(lpvalue) / 10 ** 18;
  lpinfo.innerText += "\nLP Number: " + parseInt(lpnum) / 10 ** 18;

  const pendingDegis = await InsurancePool.pendingDegis(selectedAccount);
  console.log("Pending degis:", parseInt(pendingDegis) / 10 ** 18);
  lpinfo.innerText += "\nPending degis:  " + parseInt(pendingDegis) / 10 ** 18;

  const pendingPremium = await InsurancePool.pendingPremium(selectedAccount);
  console.log("Pending premium:", parseInt(pendingPremium) / 10 ** 18);
  lpinfo.innerText +=
    "\nPending premium:  " + parseInt(pendingPremium) / 10 ** 18;
}

async function MintNFT() {
  const PolicyToken = await contracts.PolicyToken.at(Address.PolicyToken);
  const tx = await PolicyToken.mintPolicyToken(selectedAccount, {
    from: selectedAccount,
  });
  console.log("Tx Hash:", tx.tx);
}

async function NewPolicy() {
  ifConnected();

  const PolicyFlow = await contracts.PolicyFlow.at(Address.PolicyFlow);
  const MockUSD = await contracts.MockUSD.at(Address.MockUSD);

  let premium = web3.utils.toWei(
    document.getElementById("premium").value,
    "ether"
  );
  let payoff = web3.utils.toWei(
    document.getElementById("payoff").value,
    "ether"
  );
  let timestamp = new Date().getTime();

  timestamp1 = timestamp / 1000 + 86400 + 100; // 买24小时后的航班
  timestamp2 = timestamp1 + 300; // 飞行时间5min
  console.log("departure timestamp:", timestamp1);
  console.log("departure time:", timestampToTime(timestamp1));

  const tx1 = await MockUSD.approve(
    Address.InsurancePool,
    web3.utils.toBN(premium),
    {
      from: selectedAccount,
    }
  );
  console.log("Tx Hash:", tx1.tx);

  const tx2 = await PolicyFlow.newApplication(
    selectedAccount,
    0,
    web3.utils.toBN(premium),
    web3.utils.toBN(payoff),
    timestamp1,
    timestamp2,
    { from: selectedAccount }
  );
  console.log("Tx Hash:", tx2.tx);
  console.log(tx2);
  console.log("policy Id:", tx2.logs[0].args[0]);
}

async function NewSettlement() {
  ifConnected();

  const PolicyFlow = await contracts.PolicyFlow.at(Address.PolicyFlow);
  console.log("policy flow address:", ps.address);

  flight_number = document.getElementById("flightNumber").value;
  console.log("flight number is:", flight_number);

  policy_order = document.getElementById("policyOrder").value;
  console.log("policy order is:", policy_order);

  date = document.getElementById("date").value;
  console.log("date is:", date);

  // const linkAddress = "0x01BE23585060835E02B77ef475b0Cc51aA1e0709"
  const linkAddress = await PolicyFlow.getChainlinkToken();
  console.log("link address:", linkAddress);
  const linkToken = await contracts.LinkTokenInterface.at(linkAddress);

  const payment = "1000000000000000000";
  const tx1 = await linkToken.transfer(PolicyFlow.address, payment, {
    from: App.account,
  });
  console.log(tx1.tx);

  const req = await PolicyFlow.newClaimRequest(
    policy_order,
    flight_number,
    date,
    "data.0.depart_delay",
    true,
    { from: selectedAccount }
  );
  console.log(req);

  let flightStatus = await PolicyFlow.getResponse();

  console.log("flightStatus:", flightStatus);
  await sleep(60000);
  flightStatus = await PolicyFlow.getResponse();
  console.log("flightStatus:", flightStatus);
}

async function HarvestPremium() {
  const InsurancePool = await contracts.InsurancePool.at(Address.InsurancePool);
  const tx = await InsurancePool.harvestPremium(selectedAccount, {
    from: selectedAccount,
  });
  console.log("Tx Hash:", tx.tx);
}

async function HarvestDegis() {
  const InsurancePool = await contracts.InsurancePool.at(Address.InsurancePool);
  const tx = await InsurancePool.harvestDegisReward(selectedAccount, {
    from: selectedAccount,
  });
  console.log("Tx Hash:", tx.tx);
}

async function ShowUserPolicy() {
  const PolicyFlow = await contracts.PolicyFlow.at(Address.PolicyFlow);
  console.log("PolicyFlow address:", PolicyFlow.address);

  const policycount = await PolicyFlow.getUserPolicyCount(selectedAccount, {
    from: selectedAccount,
  });
  console.log("Your policy amount:", policycount.toString());

  let policyinfo = document.getElementById("policyinfo");
  policyinfo.innerText = "Pool Info";

  policyinfo.innerText += "\nYour policy amount: " + policycount.toString();

  const userpolicy = await PolicyFlow.viewPolicy(selectedAccount, {
    from: selectedAccount,
  });
  console.log(userpolicy);
  policyinfo.innerText += "\n Your policy info: " + userpolicy;
}

async function GetAllPolicyInfo() {
  const PolicyFlow = await contracts.PolicyFlow.at(Address.PolicyFlow);

  const total_policy = await PolicyFlow.Total_Policies.call({
    from: selectedAccount,
  });
  console.log("Total policy amount in the pool:", parseInt(total_policy));
  for (let i = 0; i < parseInt(total_policy); i++) {
    await PolicyFlow.getPolicyIdByCount(i, { from: selectedAccount }).then(
      (value) => {
        console.log("policyId", i, ":", value);
      }
    );
    await PolicyFlow.getPolicyInfoByCount(i, { from: selectedAccount }).then(
      (value) => {
        console.log(value);
      }
    );
  }
}

async function StartLottery() {
  ifConnected();

  const Lottery = await contracts.DegisLottery.at(Address.DegisLottery);
  const linkToken = await contracts.LinkTokenInterface.at(
    Address.LinkTokenInterface
  );
  const RandomGenerator = await contracts.RandomNumberGenerator.at(
    Address.RandomNumberGenerator
  );

  amount = web3.utils.toWei("1", "ether");

  let LotteryInR = await RandomGenerator.DegisLottery.call({
    from: selectedAccount,
  });
  if (LotteryInR == Address.DegisLottery) {
    console.log("Already set the degis lottery address");
  } else {
    await RandomGenerator.setLotteryAddress(Address.DegisLottery, {
      from: selectedAccount,
    });
  }

  let lotteryLinkBalance = await linkToken.balanceOf(RandomGenerator.address);
  if (lotteryLinkBalance >= 1)
    console.log(
      "Enough LINK TOKEN for RandomGenerator:",
      parseInt(lotteryLinkBalance) / 10 ** 18
    );
  else {
    await linkToken.transfer(RandomGenerator.address, amount, {
      from: selectedAccount,
    });
    lotteryLinkBalance = await linkToken.balanceOf(RandomGenerator.address);
    console.log(
      "[INFO]:",
      "CONTRACT(RANDOM) LINK BALANCE",
      web3.utils.fromWei(lotteryLinkBalance.toString())
    );
  }

  let injector = await Lottery.injectorAddress.call({ from: selectedAccount });
  console.log("Injector:", injector);
  if (injector == Address.InsurancePool) {
    console.log("Already Set Up Injector");
  } else {
    const pre_tx = await Lottery.setOperatorAndTreasuryAndInjectorAddresses(
      selectedAccount,
      selectedAccount,
      Address.InsurancePool,
      { from: selectedAccount }
    );
  }

  const currentLotteryId = await Lottery.viewCurrentLotteryId({
    from: selectedAccount,
  });
  const lotteryDetails = await Lottery.viewLottery(currentLotteryId);
  if (lotteryDetails.status != 3) {
    alert("This round of lottery has not been claimable");
  } else {
    let timestamp = new Date().getTime();
    console.log("current time:", timestampToTime(timestamp));
    timestamp = parseInt(timestamp / 1000 + 86400 * 3); // 3days
    console.log("end time:", timestampToTime(timestamp));

    const tx1 = await Lottery.startLottery(
      timestamp,
      web3.utils.toBN(10e18),
      [500, 1500, 2000, 6000],
      0,
      { from: selectedAccount }
    );
  }
}

async function ShowLotteryInfo() {
  ifConnected();

  const Lottery = await contracts.DegisLottery.at(Address.DegisLottery);
  let lotteryInfo = document.getElementById("lotteryInfo");
  lotteryInfo.innerText = "Lottery Info";

  const currentLotteryId = await Lottery.viewCurrentLotteryId({
    from: selectedAccount,
  });
  lotteryInfo.innerText += "\nCurrent Lottery Round: " + currentLotteryId;

  const lotteryDetails = await Lottery.viewLottery(currentLotteryId);
  lotteryInfo.innerText +=
    "\nStart Time: " + timestampToTime(lotteryDetails.startTime * 1000);
  lotteryInfo.innerText +=
    "\nStart Time: " + timestampToTime(lotteryDetails.endTime * 1000);
  lotteryInfo.innerText += "\nCurrent Lottery Status: " + lotteryDetails.status;
  lotteryInfo.innerText += " (0:Pending, 1:Open, 2:Close, 3:Claimable)";
  lotteryInfo.innerText +=
    "\nCurrent Lottery Amount: " + lotteryDetails.amountCollected / 1e18;

  if (lotteryDetails.status == 3) {
    const userAward = await Lottery.viewClaimAllTickets(currentLotteryId, {
      from: selectedAccount,
    });
    lotteryInfo.innerText +=
      "\nYour Award in Round" +
      currentLotteryId +
      ": " +
      web3.utils.fromWei(userAward.toString());
  } else {
    console.log("this round has not been claimable");
  }
}

async function InjectFunds() {
  ifConnected();
  const Lottery = await contracts.DegisLottery.at(Address.DegisLottery);
  const MockUSD = await contracts.MockUSD.at(Address.MockUSD);

  const currentLotteryId = await Lottery.viewCurrentLotteryId();
  const amount = web3.utils.toWei("1000", "ether");

  const tx1 = await MockUSD.approve(Address.DegisLottery, amount, {
    from: selectedAccount,
  });
  console.log("Tx Hash:", tx1.tx);

  const tx2 = await Lottery.injectFunds(currentLotteryId, amount, {
    from: selectedAccount,
  });
  console.log("Tx Hash:", tx2.tx);
}

async function SettleLottery() {
  ifConnected();

  const Lottery = await contracts.DegisLottery.at(Address.DegisLottery);

  const currentLotteryId = await Lottery.viewCurrentLotteryId();
  const lotteryDetails = await Lottery.viewLottery(currentLotteryId);

  if (lotteryDetails.status == 2) {
    alert("Already closed");
  } else {
    const tx1 = await Lottery.closeLottery(currentLotteryId, {
      from: selectedAccount,
    });
    console.log("Tx Hash:", tx1.tx);
  }

  if (lotteryDetails.status == 3) {
    alert("Already Claimable");
  } else {
    const tx2 = await Lottery.drawFinalNumberAndMakeLotteryClaimable(
      currentLotteryId,
      1,
      { from: selectedAccount }
    );
    console.log("Tx Hash:", tx2.tx);
  }
}

async function ClaimAllTickets() {
  ifConnected();

  const Lottery = await contracts.DegisLottery.at(Address.DegisLottery);

  const currentLotteryId = await Lottery.viewCurrentLotteryId();
  const lotteryDetails = await Lottery.viewLottery(currentLotteryId);
  if (lotteryDetails.status == 3) {
    const tx = await Lottery.claimAllTickets(currentLotteryId, {
      from: selectedAccount,
    });
    console.log("Tx Hash:", tx.tx);
  } else {
    alert("current round not claimable now");
  }
}

async function BuyTicket() {
  ifConnected();
  const Lottery = await contracts.DegisLottery.at(Address.DegisLottery);
  const Degis = await contracts.DegisToken.at(Address.DegisToken);

  let lotteryNumber = document.getElementById("lotteryNumber").value;

  if (parseInt(lotteryNumber) < 10000 && parseInt(lotteryNumber) > 0) {
    let tickets = new Array();
    tickets[0] = parseInt(lotteryNumber) + 10000;
    console.log(tickets);
    let cost = tickets.length * 10;

    await Degis.approve(
      Address.DegisLottery,
      web3.utils.toWei(cost.toString(), "ether"),
      { from: selectedAccount }
    );

    await Lottery.buyTickets(tickets, {
      from: selectedAccount,
    });
  } else {
    alert("Please enter 4 digits");
  }
}

function timestampToTime(timestamp) {
  let date = new Date(timestamp);
  Y = date.getFullYear() + "-";
  M =
    (date.getMonth() + 1 < 10
      ? "0" + (date.getMonth() + 1)
      : date.getMonth() + 1) + "-";
  (D = (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()) + " "),
    (h =
      (date.getHours() < 10 ? "0" + date.getHours() : date.getHours()) + ":");
  m =
    (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) +
    ":";
  s = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
  return Y + M + D + h + m + s;
}

window.addEventListener("load", async () => {
  init();
  document.querySelector("#btn-connect").addEventListener("click", onConnect);
  document
    .querySelector("#btn-disconnect")
    .addEventListener("click", onDisconnect);
  bindEvents();
});
