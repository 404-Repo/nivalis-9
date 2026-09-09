/* v1.8: explicit ladder traversal, not flight or an invisible ramp.
 * E attaches, W/S climb at a bounded speed, Space releases. The pad edge is
 * crossed in a short visible step-over; pause/map freezes every climb phase.
 * No immunity is introduced. All combat and perception continue while climbing. */
export function makeLadderController(site,player,state,audio,onAttach=()=>{}){
  let phase='idle',time=0,from=null,latch=false,direction=1,stepClock=0;
  const top=site.topY,clearY=top+.24;
  const lerp=(a,b,t)=>a+(b-a)*t,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  function begin(name){phase=name;time=0;from={x:player.x,y:player.y,z:player.z};state.climbing=true;player.vy=0;player.speed=0;player.grounded=false;}
  function reset(){phase='idle';time=0;from=null;latch=false;stepClock=0;state.climbing=false;}
  function finish(y,z,grounded=true){player.x=site.x;player.y=y;player.z=z;player.vy=0;player.speed=0;player.grounded=grounded;phase='idle';state.climbing=false;latch=true;}
  function nearby(view){
    if(state.over||state.map||state.paused||phase!=='idle')return null;
    const bottom=Math.abs(player.y-site.bottomY)<.28&&player.z>site.z+.1&&Math.hypot(player.x-site.x,player.z-site.climbZ)<1.30;
    const upper=Math.abs(player.y-top)<.28&&player.z<site.z&&Math.hypot(player.x-site.x,player.z-site.deckZ)<1.25;
    if(!bottom&&!upper)return null;
    const dx=site.x-player.x,dz=site.z-player.z,len=Math.hypot(dx,dz);
    // Require an intentional look toward the ladder, not a passing E press.
    if(view&&len>.10&&(dx*view.x+dz*view.z)/len<.22)return null;
    return upper?'upper':'bottom';
  }
  function interact(pressed,view){
    if(!pressed)latch=false;
    if(phase!=='idle')return true;
    const location=nearby(view);if(!location)return false;
    if(pressed&&!latch){latch=true;onAttach();player.height=1.78;direction=location==='upper'?-1:1;begin(location==='upper'?'upper-mount':'lower-mount');audio.tone(160,.075,'triangle',.025,105);}
    return true;
  }
  function update(dt,keys,analog,jump){
    if(phase==='idle')return false;
    player.vy=0;player.grounded=false;player.speed=0;
    if(state.paused||state.map||state.over)return true;
    if(jump){phase='idle';state.climbing=false;latch=true;player.vy=0;return true;}
    const input=clamp((keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(analog?.y||0),-1,1);
    state.stamina=Math.min(100,state.stamina+dt*12);
    const transition=(duration,target,next)=>{
      time+=dt;const t=clamp(time/duration,0,1),smooth=t*t*(3-2*t);
      player.x=lerp(from.x,target.x,smooth);player.y=lerp(from.y,target.y,smooth);player.z=lerp(from.z,target.z,smooth);
      if(t>=1){if(next)begin(next);else finish(target.y,target.z);}
    };
    if(phase==='lower-mount'){transition(.42,{x:site.x,y:site.bottomY,z:site.climbZ},'climb');return true;}
    if(phase==='upper-mount'){
      // Lift the boots above the curb before backing over it. Horizontal travel
      // starts only after clearance, so the character cannot pass through deck steel.
      time+=dt;const t=clamp(time/.95,0,1),slide=clamp((t-.32)/.68,0,1);
      player.x=lerp(from.x,site.x,slide);player.y=lerp(top,clearY,clamp(t/.30,0,1))-.24*clamp((t-.85)/.15,0,1);player.z=lerp(from.z,site.climbZ,slide);
      if(t>=1)begin('climb');
      return true;
    }
    if(phase==='upper-exit'){
      time+=dt;const t=clamp(time/1.0,0,1),slide=clamp((t-.25)/.6,0,1),settle=clamp((t-.86)/.14,0,1);
      player.x=site.x;player.y=lerp(top,clearY,clamp(t/.24,0,1))-settle*.24;player.z=lerp(site.climbZ,site.deckZ,slide);
      if(t>=1)finish(top,site.deckZ);return true;
    }
    if(phase==='lower-exit'){transition(.38,{x:site.x,y:site.bottomY,z:site.exitZ},null);return true;}
    player.x=site.x;player.z=site.climbZ;
    if(Math.abs(input)<.06)return true;
    direction=Math.sign(input);player.speed=Math.abs(input)*site.speed;player.y=clamp(player.y+input*site.speed*dt,site.bottomY,top);
    stepClock+=Math.abs(input)*dt;
    if(stepClock>.36){stepClock=0;audio.tone(120,.045,'triangle',.018,85);audio.noise(.035,.011,720);}
    if(direction>0&&player.y>=top-.001)begin('upper-exit');
    else if(direction<0&&player.y<=site.bottomY+.001)begin('lower-exit');
    return true;
  }
  return {interact,update,reset,nearby,get phase(){return phase;},get active(){return phase!=='idle';},site};
}
