<script>
    // Falls du noch interaktive Elemente hinzufügen möchtest, kannst du hier JavaScript einfügen
  </script>
  
  <style>
    html, body, .wrapper {
      height: 80vh;
    }
  

  
    .wrapper {
      display: grid;
      align-items: center;
      justify-content: center;
      opacity: 0.8;
    }
  
    .cocktail {
      position: relative;
      width: 300px;
      height: 300px;
      border: 20px solid #fff;
      border-radius: 50%;
    }
  
    .cocktail:before {
      position: absolute;
      z-index: -2;
      width: 0;
      height: 0;
      content: '';
      border-top: 150px solid #cbe8f5;
      border-right: 150px solid #e2e9ed;
      border-bottom: 150px solid #cbe8f5;
      border-left: 150px solid #cbe8f5;
      border-radius: 150px;
    }
  
    .cocktail:after {
      position: absolute;
      z-index: -1;
      top: 70px;
      right: 70px;
      bottom: 70px;
      left: 70px;
      content: '';
      border-radius: 50%;
      background: #5db8b6;
    }
  
    .liquid {
      position: absolute;
      z-index: 3;
      top: 20px;
      right: 20px;
      bottom: 20px;
      left: 20px;
      transform: translateX(-15px);
      animation: liquid 1.5s ease-in-out infinite;
      border-radius: 50%;
      background: rgba(139, 233, 193, 0.6);
    }
  
    .straw {
      position: absolute;
      z-index: 1;
      bottom: 70px;
      left: 50%;
      width: 20px;
      height: 0;
      transform: translateX(-50%);
      border-top: 300px solid #ff7647;
      border-right: 5px solid transparent;
      border-left: 5px solid transparent;
    }
  
    .straw:before {
      position: absolute;
      top: -310px;
      right: 0;
      left: 0;
      height: 20px;
      content: '';
      transform: scale(1.5);
      border-radius: 50%;
      background: #cd4727;
    }
  
    .straw:after {
      position: absolute;
      top: -10px;
      right: 0;
      left: 0;
      height: 20px;
      content: '';
      border-radius: 50%;
      background: #ff7647;
    }
  
    .ice-cubes {
      transform-origin: 47% 65%;
      animation: ice-cubes 8s ease-in-out infinite;
    }
  
    .ice-cube {
      width: 80px;
      height: 80px;
      border-radius: 20px;
      background: #fff;
    }
  
    .ice-cube-1 {
      transform: translate(100px, 70px) rotate(10deg);
      background: #bcdbce;
    }
  
    .ice-cube-2 {
      position: relative;
      z-index: 2;
      transform: translate(160px, 100px) rotate(30deg);
    }
  
    .ice-cube-3 {
      transform: translate(40px, 0) rotate(-30deg);
    }
  
    .lemon-slice {
      position: absolute;
      z-index: 1;
      width: 125px;
      height: 65px;
      transform: translate(146px, -178px) rotate(45deg);
      animation: lemon 3s ease-in-out infinite;
      border: 10px solid #fff28b;
      border-bottom: 0;
      border-radius: 100px 100px 0 0;
      background: #cff063;
    }
  
    @keyframes liquid {
      from { transform: translateX(-15px); }
      50%  { transform: translateX(15px); }
      to   { transform: translateX(-15px); }
    }
  
    @keyframes ice-cubes {
      from { transform: rotate(0); }
      to   { transform: rotate(360deg); }
    }
  
    @keyframes lemon {
      from { transform: translate(146px, -178px) rotate(45deg); }
      50%  { transform: translate(146px, -178px) rotate(60deg); }
      to   { transform: translate(146px, -178px) rotate(45deg); }
    }
  </style>
  
  <div class="wrapper">
    <div class="cocktail">
      <div class="liquid"></div>
      <div class="ice-cubes">
        <div class="ice-cube ice-cube-1"></div>
        <div class="ice-cube ice-cube-2"></div>
        <div class="ice-cube ice-cube-3"></div>
      </div>
      <div class="lemon-slice"></div>
      <div class="leaves">
        <div class="leave leave-1"></div>
        <div class="leave leave-2"></div>
        <div class="leave leave-3"></div>
      </div>
      <div class="straw"></div>
    </div> 
  </div>
  