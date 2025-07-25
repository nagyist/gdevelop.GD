namespace gdjs {
  class PanelSpriteRuntimeObjectPixiRenderer {
    _object: gdjs.PanelSpriteRuntimeObject;
    /**
     * The _wrapperContainer must be considered as the main container of this object
     * All transformations are applied on this container
     * See updateOpacity for more info why.
     */
    _wrapperContainer: PIXI.Container;
    /**
     * The _spritesContainer is used to create the sprites and apply cacheAsBitmap only.
     */
    _spritesContainer: PIXI.Container;
    _centerSprite: PIXI.Sprite | PIXI.TilingSprite;
    _borderSprites: Array<PIXI.Sprite | PIXI.TilingSprite>;
    _wasRendered: boolean = false;
    _textureWidth = 0;
    _textureHeight = 0;

    constructor(
      runtimeObject: gdjs.PanelSpriteRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer,
      textureName: string,
      tiled: boolean
    ) {
      this._object = runtimeObject;
      const texture = (
        instanceContainer.getGame().getImageManager() as gdjs.PixiImageManager
      ).getPIXITexture(textureName);
      const StretchedSprite = !tiled ? PIXI.Sprite : PIXI.TilingSprite;
      this._spritesContainer = new PIXI.Container();
      this._wrapperContainer = new PIXI.Container();

      // All these textures are going to be replaced in the call to `setTexture`.
      // But to be safe and preserve the invariant that "these objects own their own
      // textures", we create a new texture for each sprite.
      this._centerSprite = new StretchedSprite(
        new PIXI.Texture(texture.baseTexture)
      );
      this._borderSprites = [
        // Right
        new StretchedSprite(new PIXI.Texture(texture.baseTexture)),
        // Top-Right
        new PIXI.Sprite(new PIXI.Texture(texture.baseTexture)),
        // Top
        new StretchedSprite(new PIXI.Texture(texture.baseTexture)),
        // Top-Left
        new PIXI.Sprite(new PIXI.Texture(texture.baseTexture)),
        // Left
        new StretchedSprite(new PIXI.Texture(texture.baseTexture)),
        // Bottom-Left
        new PIXI.Sprite(new PIXI.Texture(texture.baseTexture)),
        // Bottom
        new StretchedSprite(new PIXI.Texture(texture.baseTexture)),
        // Bottom-Right
        new PIXI.Sprite(new PIXI.Texture(texture.baseTexture)),
      ];

      this.setTexture(textureName, instanceContainer);
      this._spritesContainer.removeChildren();
      this._spritesContainer.addChild(this._centerSprite);
      for (let i = 0; i < this._borderSprites.length; ++i) {
        this._spritesContainer.addChild(this._borderSprites[i]);
      }
      this._wrapperContainer.addChild(this._spritesContainer);
      instanceContainer
        .getLayer('')
        .getRenderer()
        .addRendererObject(this._wrapperContainer, runtimeObject.getZOrder());
    }

    getRendererObject() {
      return this._wrapperContainer;
    }

    ensureUpToDate() {
      if (this._spritesContainer.visible && this._wasRendered) {
        // PIXI uses PIXI.SCALE_MODES.LINEAR for the cached image:
        // this._spritesContainer._cacheData.sprite._texture.baseTexture.scaleMode
        // There seems to be no way to configure this so the optimization is disabled.
        if (
          this._centerSprite.texture.baseTexture.scaleMode !==
          PIXI.SCALE_MODES.NEAREST
        ) {
          // Cache the rendered sprites as a bitmap to speed up rendering when
          // lots of panel sprites are on the scene.
          // Sadly, because of this, we need a wrapper container to workaround
          // a PixiJS issue with alpha (see updateOpacity).
          this._spritesContainer.cacheAsBitmap = true;
        }
      }
      this._wasRendered = true;
    }

    updateOpacity(): void {
      // The alpha is updated on a wrapper around the sprite because a known bug
      // in Pixi will create a flicker when cacheAsBitmap is set to true.
      // (see https://github.com/pixijs/pixijs/issues/4610)
      this._wrapperContainer.alpha = this._object.opacity / 255;
      // When the opacity is updated, the cache must be invalidated, otherwise
      // there is a risk of the panel sprite has been cached previously with a
      // different opacity (and cannot be updated anymore).
      this._spritesContainer.cacheAsBitmap = false;
    }

    updateAngle(): void {
      this._wrapperContainer.rotation = gdjs.toRad(this._object.angle);
    }

    updatePosition(): void {
      this._wrapperContainer.position.x =
        this._object.x + this._object._width / 2;
      this._wrapperContainer.position.y =
        this._object.y + this._object._height / 2;
    }

    _updateLocalPositions() {
      const obj = this._object;

      this._centerSprite.width = Math.max(
        obj._width - obj._rBorder - obj._lBorder,
        0
      );
      this._centerSprite.height = Math.max(
        obj._height - obj._tBorder - obj._bBorder,
        0
      );

      let leftMargin = obj._lBorder;
      let rightMargin = obj._rBorder;
      if (this._centerSprite.width === 0 && obj._lBorder + obj._rBorder > 0) {
        leftMargin =
          (obj._width * obj._lBorder) / (obj._lBorder + obj._rBorder);
        rightMargin = obj._width - leftMargin;
      }
      let topMargin = obj._tBorder;
      let bottomMargin = obj._bBorder;
      if (this._centerSprite.height === 0 && obj._tBorder + obj._bBorder > 0) {
        topMargin =
          (obj._height * obj._tBorder) / (obj._tBorder + obj._bBorder);
        bottomMargin = obj._height - topMargin;
      }

      //Right
      this._borderSprites[0].width = rightMargin;
      this._borderSprites[0].height = Math.max(
        obj._height - topMargin - bottomMargin,
        0
      );

      //Top
      this._borderSprites[2].height = topMargin;
      this._borderSprites[2].width = Math.max(
        obj._width - rightMargin - leftMargin,
        0
      );

      //Left
      this._borderSprites[4].width = leftMargin;
      this._borderSprites[4].height = Math.max(
        obj._height - topMargin - bottomMargin,
        0
      );

      //Bottom
      this._borderSprites[6].height = bottomMargin;
      this._borderSprites[6].width = Math.max(
        obj._width - rightMargin - leftMargin,
        0
      );

      //Top-right
      this._borderSprites[1].width = rightMargin;
      this._borderSprites[1].height = topMargin;

      //Top-Left
      this._borderSprites[3].width = leftMargin;
      this._borderSprites[3].height = topMargin;

      //Bottom-Left
      this._borderSprites[5].width = leftMargin;
      this._borderSprites[5].height = bottomMargin;

      //Bottom-Right
      this._borderSprites[7].width = rightMargin;
      this._borderSprites[7].height = bottomMargin;

      this._wasRendered = true;
      this._spritesContainer.cacheAsBitmap = false;

      const leftBorder = leftMargin;
      const topBorder = topMargin;
      const rightBorder = obj._width - rightMargin;
      const bottomBorder = obj._height - bottomMargin;

      this._centerSprite.position.x = leftBorder;
      this._centerSprite.position.y = topBorder;

      //Right
      this._borderSprites[0].position.x = rightBorder;
      this._borderSprites[0].position.y = topBorder;

      //Top-right
      this._borderSprites[1].position.x = rightBorder;
      this._borderSprites[1].position.y = 0;

      //Top
      this._borderSprites[2].position.x = leftBorder;
      this._borderSprites[2].position.y = 0;

      //Top-Left
      this._borderSprites[3].position.x = 0;
      this._borderSprites[3].position.y = 0;

      //Left
      this._borderSprites[4].position.x = 0;
      this._borderSprites[4].position.y = topBorder;

      //Bottom-Left
      this._borderSprites[5].position.x = 0;
      this._borderSprites[5].position.y = bottomBorder;

      //Bottom
      this._borderSprites[6].position.x = leftBorder;
      this._borderSprites[6].position.y = bottomBorder;

      //Bottom-Right
      this._borderSprites[7].position.x = rightBorder;
      this._borderSprites[7].position.y = bottomBorder;
    }

    setTexture(
      textureName: string,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ): void {
      const obj = this._object;
      const texture = instanceContainer
        .getGame()
        .getImageManager()
        .getPIXITexture(textureName).baseTexture;
      this._textureWidth = texture.width;
      this._textureHeight = texture.height;

      function makeInsideTexture(rect) {
        if (rect.width < 0) {
          rect.width = 0;
        }
        if (rect.height < 0) {
          rect.height = 0;
        }
        if (rect.x < 0) {
          rect.x = 0;
        }
        if (rect.y < 0) {
          rect.y = 0;
        }
        if (rect.x > texture.width) {
          rect.x = texture.width;
        }
        if (rect.y > texture.height) {
          rect.y = texture.height;
        }
        if (rect.x + rect.width > texture.width) {
          rect.width = texture.width - rect.x;
        }
        if (rect.y + rect.height > texture.height) {
          rect.height = texture.height - rect.y;
        }
        return rect;
      }
      this._centerSprite.texture.destroy(false);
      this._centerSprite.texture = new PIXI.Texture(
        texture,
        makeInsideTexture(
          new PIXI.Rectangle(
            obj._lBorder,
            obj._tBorder,
            texture.width - obj._lBorder - obj._rBorder,
            texture.height - obj._tBorder - obj._bBorder
          )
        )
      );

      //Top, Bottom, Right, Left borders:
      this._borderSprites[0].texture.destroy(false);
      this._borderSprites[0].texture = new PIXI.Texture(
        texture,
        makeInsideTexture(
          new PIXI.Rectangle(
            texture.width - obj._rBorder,
            obj._tBorder,
            obj._rBorder,
            texture.height - obj._tBorder - obj._bBorder
          )
        )
      );
      this._borderSprites[2].texture.destroy(false);
      this._borderSprites[2].texture = new PIXI.Texture(
        texture,
        makeInsideTexture(
          new PIXI.Rectangle(
            obj._lBorder,
            0,
            texture.width - obj._lBorder - obj._rBorder,
            obj._tBorder
          )
        )
      );
      this._borderSprites[4].texture.destroy(false);
      this._borderSprites[4].texture = new PIXI.Texture(
        texture,
        makeInsideTexture(
          new PIXI.Rectangle(
            0,
            obj._tBorder,
            obj._lBorder,
            texture.height - obj._tBorder - obj._bBorder
          )
        )
      );
      this._borderSprites[6].texture.destroy(false);
      this._borderSprites[6].texture = new PIXI.Texture(
        texture,
        makeInsideTexture(
          new PIXI.Rectangle(
            obj._lBorder,
            texture.height - obj._bBorder,
            texture.width - obj._lBorder - obj._rBorder,
            obj._bBorder
          )
        )
      );
      this._borderSprites[1].texture.destroy(false);
      this._borderSprites[1].texture = new PIXI.Texture(
        texture,
        makeInsideTexture(
          new PIXI.Rectangle(
            texture.width - obj._rBorder,
            0,
            obj._rBorder,
            obj._tBorder
          )
        )
      );
      this._borderSprites[3].texture.destroy(false);
      this._borderSprites[3].texture = new PIXI.Texture(
        texture,
        makeInsideTexture(new PIXI.Rectangle(0, 0, obj._lBorder, obj._tBorder))
      );
      this._borderSprites[5].texture.destroy(false);
      this._borderSprites[5].texture = new PIXI.Texture(
        texture,
        makeInsideTexture(
          new PIXI.Rectangle(
            0,
            texture.height - obj._bBorder,
            obj._lBorder,
            obj._bBorder
          )
        )
      );
      this._borderSprites[7].texture.destroy(false);
      this._borderSprites[7].texture = new PIXI.Texture(
        texture,
        makeInsideTexture(
          new PIXI.Rectangle(
            texture.width - obj._rBorder,
            texture.height - obj._bBorder,
            obj._rBorder,
            obj._bBorder
          )
        )
      );
      this._updateLocalPositions();
      this.updatePosition();
      this._wrapperContainer.pivot.x = this._object._width / 2;
      this._wrapperContainer.pivot.y = this._object._height / 2;
    }

    updateWidth(): void {
      this._wrapperContainer.pivot.x = this._object._width / 2;
      this._updateLocalPositions();
      this.updatePosition();
    }

    updateHeight(): void {
      this._wrapperContainer.pivot.y = this._object._height / 2;
      this._updateLocalPositions();
      this.updatePosition();
    }

    setColor(rgbColor): void {
      const colors = rgbColor.split(';');
      if (colors.length < 3) {
        return;
      }
      this._centerSprite.tint = gdjs.rgbToHexNumber(
        parseInt(colors[0], 10),
        parseInt(colors[1], 10),
        parseInt(colors[2], 10)
      );
      for (
        let borderCounter = 0;
        borderCounter < this._borderSprites.length;
        borderCounter++
      ) {
        this._borderSprites[borderCounter].tint = gdjs.rgbToHexNumber(
          parseInt(colors[0], 10),
          parseInt(colors[1], 10),
          parseInt(colors[2], 10)
        );
      }
      this._spritesContainer.cacheAsBitmap = false;
    }

    getColor() {
      const rgb = new PIXI.Color(this._centerSprite.tint).toRgbArray();
      return (
        Math.floor(rgb[0] * 255) +
        ';' +
        Math.floor(rgb[1] * 255) +
        ';' +
        Math.floor(rgb[2] * 255)
      );
    }

    getTextureWidth() {
      return this._textureWidth;
    }

    getTextureHeight() {
      return this._textureHeight;
    }

    destroy() {
      // Destroy textures because they are instantiated by this class:
      // all textures of borderSprites and centerSprite are "owned" by them.
      for (const borderSprite of this._borderSprites) {
        borderSprite.destroy({ texture: true });
      }
      this._centerSprite.destroy({ texture: true });
      // Destroy the containers without handling children because they are
      // already handled above.
      this._wrapperContainer.destroy(false);
      this._spritesContainer.destroy(false);
    }
  }

  export const PanelSpriteRuntimeObjectRenderer =
    PanelSpriteRuntimeObjectPixiRenderer;
  export type PanelSpriteRuntimeObjectRenderer =
    PanelSpriteRuntimeObjectPixiRenderer;
}
