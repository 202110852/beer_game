const cup = document.getElementById("cup");
// const beer = document.getElementById("beer"); // 삭제
const btn = document.getElementById("pourBtn");
const beerStream = document.getElementById("beerStream");
const beerPath = document.getElementById("beerPath");
const foamGroup = document.getElementById("foamGroup");
const bgImg = document.getElementById("backgroundImage");

let pouring = false,
  level = 0;
const maxLevel = 290; // 맥주 최대 높이(px) (348-58)
// 맥주잔 곡면 좌표 (SVG와 일치, 맥주 path는 테두리보다 약간 안쪽)
const beerTopY = 58,
  beerBotY = 348;
const beerMidX = 220;
const beerBottomRx = 88,
  beerBottomRy = 19.2,
  beerBottomCy = 348;
const beerLeftTopX = beerMidX - beerBottomRx;
const beerRightTopX = beerMidX + beerBottomRx;
const beerColor = "#f4a460";
const foamColor = "#fffbe8";

let foamBubbles = [];

// 퍼센트 계산 함수만 남김
function getPercent() {
  return ((level / maxLevel) * 100).toFixed(1);
}

// 이미지 미리 로드
const beer1Img = new Image();
beer1Img.src = "beer1.png";
const beer2Img = new Image();
beer2Img.src = "beer2.png";

// 기존 btn(따르기 시작 버튼) 관련 코드 제거 및 bgImg에 이벤트 연결
// 기존 mousedown, mouseup, touchstart, touchend, mouseleave 이벤트 제거
window.addEventListener("DOMContentLoaded", () => {
  const bgImg = document.getElementById("backgroundImage");

  // pointer 이벤트 바인딩 ...

  // 우클릭(컨텍스트 메뉴) 방지
  bgImg.addEventListener("contextmenu", (e) => e.preventDefault());
  // 이미지 드래그 방지
  bgImg.addEventListener("dragstart", (e) => e.preventDefault());
  // 모바일에서 길게 눌러도 메뉴 안 뜨게
  bgImg.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length > 1) e.preventDefault();
    },
    { passive: false }
  );

  bgImg.addEventListener("pointerdown", () => {
    bgImg.src = "beer2.png";
    pouring = true;
    beerStream.style.display = "block";
    updateBeerStream();
  });
  bgImg.addEventListener("pointerup", () => {
    bgImg.src = "beer1.png";
    pouring = false;
    beerStream.style.display = "none";
    const percent = getPercent();
    if (percent > 99 && percent < 100) {
      showModal("축하합니다 맥주를 100% 채웠어요!", false, true);
    } else if (percent < 100) {
      showModal(`맥주를 ${Math.floor(percent)}% 채웠어요!`);
    }
  });
  bgImg.addEventListener("pointerleave", () => {
    bgImg.src = "beer1.png";
    pouring = false;
    beerStream.style.display = "none";
  });
});

function updateBeerStream() {
  // 맥주줄기: 맥주잔 입구 중앙 위에서 맥주 표면(topY)까지
  const cupRect = cup.getBoundingClientRect();
  const svgRect = beerPath.ownerSVGElement.getBoundingClientRect();
  const topY = beerBotY - level;
  // SVG 좌표를 px로 변환
  const svgScale = svgRect.height / 408;
  const streamTop = svgRect.top - cupRect.top - 60; // 60px 위에서 시작
  const streamHeight = topY * svgScale + 60;
  beerStream.style.top = `${streamTop}px`;
  beerStream.style.height = `${streamHeight}px`;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function drawBeer(level) {
  if (level <= 0) {
    beerPath.setAttribute("d", "");
    return;
  }
  const topY = beerBotY - level;
  const leftX = beerLeftTopX;
  const rightX = beerRightTopX;
  let topPath = `M${leftX},${topY} L${rightX},${topY}`;
  topPath += ` L${rightX},${beerBotY}`;
  const waveLen = 32;
  for (let i = 0; i <= waveLen; i++) {
    const t = i / waveLen;
    const theta = 0 + Math.PI * t; // 0~π
    const x = beerMidX + beerBottomRx * Math.cos(theta);
    const y = beerBottomCy + beerBottomRy * Math.sin(theta);
    topPath += ` L${x},${y}`;
  }
  topPath += ` L${leftX},${topY}`;
  topPath += ` Z`;
  beerPath.setAttribute("d", topPath);
}

function updateFoam(level) {
  if (level <= 0) {
    foamGroup.innerHTML = "";
    return;
  }
  const topY = beerBotY - level;
  const leftX = beerLeftTopX;
  const rightX = beerRightTopX;
  const targetCount = Math.floor((6 + level / 40) * 30); // 거품 30배
  while (foamBubbles.length < targetCount) {
    // 거품이 맥주잔 입구 타원 내부에서만 생성
    const t = Math.random();
    const theta = 0 + Math.PI * t;
    const x = beerMidX + beerBottomRx * Math.cos(theta);
    const y = topY - 30 + Math.random() * 60; // 윗면 근처, 세로 범위 +-30
    foamBubbles.push({
      x,
      y,
      r: 5 + Math.random() * 7,
      dx: (Math.random() - 0.5) * 0.2,
      dy: (Math.random() - 0.5) * 0.1,
    });
  }
  foamBubbles.forEach((b) => {
    b.x += b.dx;
    b.y += b.dy + Math.sin(Date.now() / 400 + b.x) * 0.05;
    // 거품이 맥주잔 입구 타원 내부를 벗어나지 않게
    const dx = b.x - beerMidX;
    if (Math.abs(dx) > beerBottomRx)
      b.x = beerMidX + Math.sign(dx) * beerBottomRx;
    if (b.y < topY - 30) b.y = topY - 30;
    if (b.y > topY + 30) b.y = topY + Math.random() * 8;
  });
  foamGroup.innerHTML = foamBubbles
    .map(
      (b) =>
        `<circle cx="${b.x.toFixed(1)}" cy="${b.y.toFixed(1)}" r="${b.r.toFixed(
          1
        )}" fill="${foamColor}" opacity="0.85" />`
    )
    .join("");
  if (foamBubbles.length > targetCount) foamBubbles.length = targetCount;
}

// 커스텀 모달 함수
function showModal(msg, onlyRetry = false, onlyShare = false) {
  const modal = document.getElementById("customModal");
  const msgSpan = document.getElementById("customModalMsg");
  const shareBtn = document.getElementById("customModalShareBtn");
  const retryBtn = document.getElementById("customModalRetryBtn");
  msgSpan.innerHTML = msg;
  modal.style.display = "flex";
  if (onlyShare) {
    shareBtn.style.display = "";
    retryBtn.style.display = "none";
  } else if (onlyRetry) {
    shareBtn.style.display = "none";
    retryBtn.style.display = "";
  } else {
    shareBtn.style.display = "";
    retryBtn.style.display = "";
  }
}

// 버튼 핸들러
const shareBtn = document.getElementById("customModalShareBtn");
const retryBtn = document.getElementById("customModalRetryBtn");
shareBtn.onclick = async function () {
  const percent = getPercent();
  const shareMsg = `${percent}%만큼 맥주를 채웠어요! 🍺`;
  const shareUrl = location.href;
  const cupElem = document.getElementById("cup");
  try {
    // 화면 캡처
    const canvas = await html2canvas(document.body, { backgroundColor: null });
    // 이미지 다운로드
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "beer_game.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // 이후 기존 공유 로직...
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    const file = new File([blob], "beer_game.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: "맥주 게임",
        text: shareMsg + "\n" + shareUrl,
        files: [file],
      });
    } else if (navigator.share) {
      await navigator.share({
        title: "맥주 게임",
        text: shareMsg + "\n" + shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(shareMsg + "\n" + shareUrl);
      shareBtn.textContent = "복사됨!";
      setTimeout(() => {
        shareBtn.textContent = "공유하기";
      }, 1200);
    }
  } catch (e) {
    await navigator.clipboard.writeText(shareMsg + "\n" + shareUrl);
    shareBtn.textContent = "복사됨!";
    setTimeout(() => {
      shareBtn.textContent = "공유하기";
    }, 1200);
  }
};
retryBtn.onclick = function () {
  document.getElementById("customModal").style.display = "none";
  level = 0;
  drawBeer(level);
  updateFoam(level);
};

function update() {
  if (pouring) {
    beerStream.style.left = "50%";
    updateBeerStream();
    level += 2;
    if (getPercent() == 100) {
      level = maxLevel;
      pouring = false;
      beerStream.style.display = "none";
      showModal("맥주가 넘쳤습니다!🌊<br>다시시도해주세요", true);
    }
  } else {
    beerStream.style.left = "50%";
  }
  drawBeer(level);
  updateFoam(level);
  requestAnimationFrame(update);
}

function alignBeerImageToCup() {
  const svg = document.getElementById("beerCupSVG");
  const bgImg = document.getElementById("backgroundImage");
  // SVG y=-40 위치에 맞춤
  const svgY = -50;
  const imgRefY = 129;
  const pt = svg.createSVGPoint();
  pt.x = 0;
  pt.y = svgY;
  const screenPos = pt.matrixTransform(svg.getScreenCTM());
  bgImg.style.position = "absolute";
  bgImg.style.left = "50%";
  bgImg.style.top = screenPos.y + "px";
  bgImg.style.transform = `translate(-50%, -${imgRefY}px)`;
}

window.addEventListener("DOMContentLoaded", alignBeerImageToCup);
window.addEventListener("resize", alignBeerImageToCup);

update();
