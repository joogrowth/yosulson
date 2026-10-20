# 만유지 ChatGPT 프롬프트

ChatGPT, 또는 다른 이미지 AI에 넣을 때 순서다.

1. 새 채팅을 연다.
2. 몸 정본 `references/front.jpg`, `references/side.jpg`, `references/back.jpg`와 얼굴 정본 `references/face-front.jpg`, `references/face-side.jpg`, `references/face-set-cafe.jpg`, `references/face-set-bob.jpg`, `references/face-set-bun.jpg`, `references/face-set-alley.jpg`를 모두 올린다.
3. `references/face.jpg`, `references/cafe-white-approved.jpg`, `references/face-fit-front.jpg`, `references/face-fit-side.jpg`, `references/face-fit-source.jpg`, `standard-sheet.jpg`는 올리지 않는다. 그 얼굴은 이전 얼굴이다. `standard-sheet.jpg`는 몸매를 눈으로 확인할 때만 따로 본다.
4. 아래 마스터 프롬프트를 첫 메시지로 붙인다.
5. 그다음 컷 프롬프트 하나만 붙인다.
6. 얼굴이나 비율이 달라지면, 그 결과에 교정 프롬프트를 답장으로 붙인다. 새로 그리지 말고 틀린 부위를 문장으로 지정한다.

비율은 세로 3:4다.

## 마스터 프롬프트

```text
The attached photos are the canon for one fictional woman named 만유지. front.jpg, side.jpg, and back.jpg are the BODY only. Their faces are an older face. Ignore those faces. face-front.jpg and face-side.jpg are the locked face and nose. face-set-cafe.jpg is only a source photo for the eyes and lips. face-set-alley.jpg is the near-profile original. face-set-bob.jpg and face-set-bun.jpg are the skull originals. Do not use face.jpg, cafe-white-approved.jpg, face-fit-front.jpg, face-fit-side.jpg, face-fit-source.jpg, or standard-sheet.jpg for the face. Do not average her into a generic pretty woman and do not return to the older narrower sleepy eyes, the fitting-room face, or the chestnut high ponytail. A new outfit or a new place is allowed. Her face, skull, and these body points are not. The face photos are not the bust reference. Keep the bust at a 70B that stays inside the shoulder width. The slicked hair in face-front.jpg and face-side.jpg only reveals the skull. It is not the required hairstyle.

FACE AND NOSE, locked to face-front.jpg and face-side.jpg. The user confirmed these two plates. They override every older nose, including face.jpg and the short flat nose. The front nose and the side nose are the same nose.
Soft short face with full cheeks and a short round chin. Not a long narrow face. Thin dark brows, soft arch. Large round dark-brown eyes, thin soft double eyelids, large glossy irises, aegyo-sal, thin eyeliner. Do not narrow the eyes into a long almond. Nose: one straight bridge, the length and height of face-front.jpg and face-side.jpg. From the side the bridge is not low. The tip is small and round and does not point down. No bump, no hook. Small nostrils, short philtrum. Full glossy peach-pink lips, lower lip slightly fuller, mouth closed or barely parted, no teeth. Fair dewy skin, light blush. On a three-quarter view the iris stays visible. face-side.jpg is three-quarter, not a pure 90-degree profile.

SKULL, inferred from face-set-bob.jpg, face-set-bun.jpg, and face-side.jpg
There is no bare-head photo. The skull is a narrow egg, a little longer front to back than side to side. The crown is low and smoothly rounded, not flat and not peaked. One gentle arc runs from above the ear to the crown. The temples are narrow and do not bulge. The widest part of the skull is just above the ears and is only slightly wider than the cheekbones. The forehead is not wide. In profile the forehead slopes gently back from the brow. The occiput is low and short, rounding down into the neck. It is not cut flat and it does not project backward as a ball. A low bun sits at the base of that occiput, just above the neck. The face narrows from this skull toward the chin.

HAIR
Hair color and style are not locked. The source set uses black, chestnut, auburn, and ash, and bob, bun, braid, and loose hair. Follow the hairstyle named in the shot. If the shot names none, use dark brown and keep the face visible. The skull shape stays the same under every hairstyle.

UPPER BODY, crown to underbust
Small head, about one eighth of her height. Long slim neck. Both collarbones visible. Narrow rounded shoulders, not broad, not square, no thick trapezius. Slim long arms, thin wrists, small hands. Bust is high, full, and rounded forward. From the front it stays inside the shoulder width. From the side it projects clearly from the ribcage. Under the bust the torso narrows at once.

MID BODY, underbust to hip
The waist is the narrowest part and the waist section is short. Stomach is flat and soft, not muscular. Navel is small. A cropped top shows one slim band of midriff, with the navel visible. Hip bones flare wider than the waist. On a high-rise jean the button sits just below the navel.

LOWER BODY, hip to feet
Upper thighs are soft and long, lightly touching at the top, then tapering. Thigh length is as long as the calf. Knees are small. Calves are slim and straight. Ankles are narrow and the ankle bone shows. Jean hems end at the ankle bone. Feet are small. Shoe soles are thin, so the leg line is not shortened.

SIDE SILHOUETTE, from side.jpg
The nose matches face-front.jpg and face-side.jpg: one straight bridge, not low from the side, small round tip that does not drop. Full glossy lips slightly ahead of a short round chin. Low rounded crown and a low short occiput. Bust forward, waist inward, hip and seat backward. The fullest point of the hip meets the top of the thigh. Legs stay long and mostly straight.

BACK SILHOUETTE, from back.jpg. This seat shape is locked.
Narrow back, shoulder blades not prominent. A strip of lower-back skin between the crop top and the jeans. The waist is the narrowest point, then the pelvis flares immediately to the left and right. The seat is round and divided into a left and a right side. The widest point is the back-pocket line. Below the seat the curve continues into the back of the thigh, with no horizontal gap. Do not raise two separate spheres, do not cut a shelf under the seat, and do not taper the seat to a narrow point. Keep this width. Do not enlarge it. Thighs continue long behind the seat. Knees stay close. Calves and ankles stay slim.

PROPORTION
Vertical 3:4. Head near the top edge, shoes near the bottom edge. Hip-to-floor is longer than shoulder-to-hip. The lower body is longer than the upper body. Shoulders narrow, bust forward, waist smallest, hips wider than the shoulders.

CLOTHING THAT SHOWS THESE POINTS
Fitted ribbed top. Square neck or wide scoop, open enough to show the inner collarbone and the upper bust. Hem above the navel. High-rise skinny jeans, button under the navel, hem at the ankle, fabric following the thigh and seat. Thin soles.

The twelve points that must survive every image:
1 soft short face, full cheeks, large round dark eyes, thin double eyelid, aegyo-sal, the straight nose locked in face-front.jpg and face-side.jpg, full glossy pink lips
2 narrow egg-shaped skull, low rounded crown, narrow temples, low short occiput. Hair color and style follow the shot
3 small head, long neck, narrow shoulders, visible collarbones
4 high forward bust inside the shoulder width
5 short narrow waist directly under the bust
6 flat soft stomach and small navel
7 hips wider than the waist
8 side view: bust forward, waist in, seat back
9 back view: narrow back, immediate hip flare, round seat widest at the back pockets and continuing into the thigh
10 long soft upper thighs, slim knees, slim calves, narrow ankles
11 hip-to-floor longer than shoulder-to-hip, jean hem at the ankle
12 fitted ribbed neckline and high-rise skinny jeans so those points stay visible

Photorealistic, sharp, and clean. best-standard.jpg is the sharpness reference only. Do not copy its face or its chestnut ponytail. One woman. No text, no logo, no watermark. Do not add grain or blur to fake a photograph. Keep this lock for the whole chat.
```

## 컷 프롬프트

마스터 프롬프트 다음에 하나만 보낸다.

### 앞

```text
Full-body front view, 3:4, same woman and the same twelve body points. She stands straight, arms relaxed, eyes toward the camera. Outfit: ivory ribbed short-sleeve square-neck crop top, hem above the navel, light-wash high-rise skinny jeans, white thin-soled sneakers. Plain bright room, pale wall, wood floor. Head near the top, shoes near the bottom.
```

### 옆

```text
Full-body three-quarter side view, 3:4. Read the side silhouette: bust forward, waist inward, seat backward, long thigh, slim calf, narrow ankle. One hand on the waist. Outfit: black ribbed sleeveless square-neck top, medium-blue high-rise skinny jeans, white thin-soled sneakers. Indoor concrete stair landing with a window.
```

### 뒤

```text
Full-body back view, 3:4. Narrow back, short waist, pelvis flaring just below the waist, round seat divided left and right, long thighs, close knees, slim calves. She walks away and turns her head enough to show a little of the cheek. Outfit: plain sage short-sleeve crop top with no mark, dark indigo high-rise skinny jeans, low ankle shoes with a thin sole. Quiet residential alley, afternoon light.
```

### 얼굴

```text
Waist-up portrait, 3:4. Match face-front.jpg. Soft short face, full cheeks, large round dark-brown eyes, thin double eyelids, aegyo-sal, the locked straight nose, full glossy pink lips, fair dewy skin. Dark brown hair with loose strands around the face. Long neck, bust inside the shoulder width. Black top. Even light.
```

### 옷만 바꾸기

괄호만 바꾼다.

```text
Keep all twelve body points and the same face. Change only the clothes and the place. New top: [색] fitted ribbed [반팔/긴팔/민소매] [스퀘어넥/스쿱넥], hem above the navel, collarbone and upper bust visible. New bottom: [연청/중간 블루/진청] high-rise skinny jeans, hem at the ankle. Thin-soled shoes. Full body, 3:4. Place: [장소]. New pose. Head near the top, shoes near the bottom.
```

## 부위가 어긋났을 때

틀린 이미지에 답장으로 붙인다. 한 번에 한 부위만 고친다.

얼굴:

```text
Keep the body, pose, outfit, and frame. Replace only the face with face-front.jpg and face-side.jpg: soft short face, full cheeks, large round dark-brown eyes, thin double eyelids, aegyo-sal, the locked straight nose with the side bridge not low, full glossy pink lips. Keep the hairstyle of the shot. Do not narrow the eyes. Do not lower the bridge or drop the tip.
```

다리:

```text
Keep the face and outfit. Lengthen the lower body. Hip-to-floor longer than shoulder-to-hip. Long upper thigh, slim knee, slim calf, narrow ankle, jean hem at the ankle bone, thin sole. Head near the top of the 3:4 frame, shoes near the bottom.
```

허리와 골반:

```text
Keep the face and the long legs. Make the waist the narrowest and shortest part, stomach flat, hips wider than the waist. From the side, bust forward, waist in, seat back, and the fullest point of the seat meets the upper thigh. From the back, the pelvis flares immediately under the waist. The seat is round and divided, widest at the back pockets, then continues into the thigh. Do not enlarge it, do not lift it into two spheres, do not add a gap under it, and do not taper it to a point.
```

가슴과 어깨:

```text
Keep the face and the legs. Narrow rounded shoulders, visible collarbones, bust high and rounded forward but still inside the shoulder width. The ribbed neckline shows the upper bust. The waist narrows directly under the bust.
```

눈:

```text
Keep everything else. Match the eyes to the user's front photos: large, round, dark brown, thin double eyelid, aegyo-sal, glossy iris. Do not narrow them.
```
