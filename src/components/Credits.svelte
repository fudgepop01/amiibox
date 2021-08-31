<script>
</script>

<style>
  .container {
    padding: 10px 20px;
  }
</style>
<div class="container">
  <h1>Credits</h1>

  <p>
    While this app was created by fudgepop01 (me), it has been the community's passion that has kept things alive and well.
    truth be told, I took very little part in the community aspect -- I'm mostly interested in just seeing
    what cool things folks can make amiibo do ahahah~
  </p>
  <p>
    In particular: BIG shoutouts to these folks, in no particular order
  </p>
  <ul>
    <li>Amiibo Doctor</li>
    <li>Jozz</li> 
    <li>Cloud9</li> 
    <li>thatmagicstore</li>
    <li>Hidari</li>
    <li>Armored Sage</li>
    <li>untitled1991</li>
    <li>CraigUK37</li>
    <li>Nozzly</li>
  </ul>
  <p>
    On top of this, shoutouts to the various content producers that have taken the time to manually train up all sorts of amiibo by hand. Without
    you folks, I likely never would have even considered amiibo in the first place!
  </p>


  <h2>History</h2>
  <p>
    Smash AI has always been something I've been interested in, and for a long while I had no way of modding Brawl to give me
    the tools I needed to do stuff there with Project+ (shoutouts to Fracture for making that possible).
  </p>
  <p>
    The closest thing I had was an amiibo figure... and I figured that: because amiibo can be taken from place to place even without
    internet connection, then there must be SOME amount of data stored on the figurine itself. Soooo... being that it was my only
    chance to mod AI in smash, I got to work with my second taste of actual reverse engineering.
  </p>
  <p>
    After a long and arduous process of getting low level scanner code to work with my scanner for amiibo, with lots and lots of hours
    of research poured into figuring out how the scanner worked, I was able to finally read from and write to my own amiibo figures!
    Of course - there was a catch: there was very little actually known about how the amiibo figures worked under the hood.
  </p>
  <p>
    More days of research later, and I finally managed to write to some of the known amiibo offsets, changing things like the level
    value and stuff. I eventually started brute-forceing with trial and error (yes, this did take as long as it sounds) to figure out 
    what bytes were responsible for changing what with regards to the visible amiibo stats on the overview screen. There was one thing
    that puzzled me though...
  </p>
  <h3>personality</h3>
  <p>
    to everyone at the time, the personality of the amiibo was a total enigma. Nobody had any idea what bytes caused it to change or update,
    so I spent more hours to figure that out. I eventually realized that there was a particular region of data that causes it to change, 
    so I wrote that down and started testing! 
  </p>
  <p>
    at first I tried randomly generating values for every individual byte in the personality section and recording the results. I eventually
    tried to dabble with machine learning to try to predict exactly what data would result in what personality value. This was an interesting
    process, but didn't really do a whole lot in terms of findings. Then I tried to visualize data to see if I could detect any patterns there.
    Sadly, the only thing I really got was a cool visualization that you might be able to see for yourself if you get 
    <a href="https://github.com/fudgepop01/amiibo_research">this repo working.</a> (data --> visualization --> npm install; npm run dev)
  </p>
  <p>
    Eventually I had enough... I wanted something better. I wanted to create a tool to revolutionize folks' understanding of amiibo, practice my
    web dev skills, and also track regions, all in an incredibly dynamic package. So, I went ahead and created amiibox! I used electron and svelte3
    for just about everything - and it worked extremely well!
  </p>
  <h3>Exion / USAC</h3>
  <p>
    After posting about my findings and some videos on twitter / youtube, Amiibo Doctor reached out and introduced me to Exion, where I was eventually
    introduced to USAC. I was amazed that there was a scene built around training and understanding amiibo. It was super cool! But an issue eventually
    arose: With regulated tournaments, there was a chance to use this full version of amiibox to cheat... so, to my dismay (at the time), I created
    tournamiibox and the resources for it. As least I could give something to the community, even if it doesn't help AI research. I also created a
    customizable validator to enable folks to host amiibo tournaments with their own rulesets, and check a folder of bin files instantly!
  </p>
  <p>
    Fast forward about a year and a half, and here we are today! Despite the security measures, someone figured out how to circumvent them, allowing
    for cheating. So, for better or worse, I'm pleased to finally release the full version of amiibox to the public! This version enables you to
    change what regions get updated with ease!~ This means you'll also be able to modify the personality traits and underlying AI.
  </p>
  <p>
    the attack frequencies, oddly enough, don't actually change the personality itself - however they still change the behavior of the amiibo. This
    is likely one of the main things that amiibo do while learning. They still aren't fully understood, but the hope is that releasing this full
    version, some folks will get curious and do some research on their own or altogether and create a community regions.txt file with all the
    information figured out. I'll be looking forward to that day for sure. 
  </p>
  <p>
    Until then, enjoy amiibox! Ciao for now!~
  </p>
  <h1> - fudgepop01 </h1>
</div>
